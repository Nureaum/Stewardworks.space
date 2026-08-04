'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Check, ChevronDown, Camera, Loader2, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { fetchUserBookmarks } from '@/app/actions/bookmarks';
import { fetchAllWorkforceEntries, fetchUserPicks } from '@/app/admin/workforce-pathways/actions';
import { PATHWAYS, QUIZZES } from '@/data/workforce-content';
import { addEngagement, updateEngagement, removeEngagement, uploadNoteImage } from '@/app/actions/workshops/engagement';
import RetroToast from '@/components/workshops/journey/RetroToast';
import { PixelSprite } from '@/components/workshops/journey';
import RichTextEditor from '@/components/admin/RichTextEditor';
import type { CohortProgressData } from './page';

// Status pill mapping for deliverables (same as Portfolio)
const STATUS_PILL: Record<string, { label: string; color: string }> = {
  not_submitted: { label: 'NOT SUBMITTED', color: '#a493c9' },
  submitted:     { label: 'PENDING REVIEW', color: '#ffd23f' },
  approved:      { label: 'APPROVED · +25%', color: '#74f0a0' },
  rejected:      { label: 'NEEDS REVISION', color: '#ff8a4a' },
};

export const parseNoteContent = (contentStr: string | null) => {
  if (!contentStr) return { text: '', html: '', images: [], subType: 'note', version: 1 };
  try {
    const parsed = JSON.parse(contentStr);
    if (parsed && typeof parsed === 'object') {
      if (parsed.version === 2) {
        return parsed;
      }
      // Handle legacy or specific JSON payloads (like {"originalKind": "note"})
      return { 
        text: parsed.text || '', 
        html: parsed.html || '', 
        images: parsed.images || [], 
        subType: parsed.originalKind || parsed.subType || 'note', 
        version: 1 
      };
    }
  } catch (e) {
    // legacy format or simple string
  }
  return { text: contentStr, html: '', images: [], subType: 'note', version: 1 };
};

export default function ClientProfile({ 
  initialProfile, 
  chiaProgress = 0, 
  engagementProgress = 0,
  workshopDays = [],
  progressRows = [],
  submissions = [],
  activeCohortId: initialCohortId = null,
  allCohortProgress = [],
  workshopCharacter: initialWorkshopCharacter = null
}: { 
  initialProfile: any; 
  chiaProgress?: number; 
  engagementProgress?: number;
  workshopDays?: any[];
  progressRows?: any[];
  submissions?: any[];
  activeCohortId?: string | null;
  allCohortProgress?: CohortProgressData[];
  workshopCharacter?: any;
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
  const [selectedNoteItem, setSelectedNoteItem] = useState<any | null>(null);
  const [selectedResourceItem, setSelectedResourceItem] = useState<any | null>(null);
  
  // Engagement counts
  const [engagementCounts, setEngagementCounts] = useState({ bookmarks: 0, notes: 0, prompts: 0, miniDeliverables: 0, generations: 0, envSuggestions: 0, wfSuggestions: 0, libSuggestions: 0, showcase: 0, showcaseForm: 0 });
  
  // Generations State
  const [generations, setGenerations] = useState<any[]>([]);
  
  // Environmental Suggestions State
  const [envSuggestions, setEnvSuggestions] = useState<any[]>([]);
  // Workforce Suggestions State
  const [wfSuggestions, setWfSuggestions] = useState<any[]>([]);
  const [libSuggestions, setLibSuggestions] = useState<any[]>([]);
  
  // Notes & Prompts State
  const [notes, setNotes] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [workshopBookmarks, setWorkshopBookmarks] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteType, setNoteType] = useState<'note' | 'prompt'>('note');
  const [isMiniDeliverable, setIsMiniDeliverable] = useState(false);
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [noteHtmlContent, setNoteHtmlContent] = useState('');
  const [miniDeliverables, setMiniDeliverables] = useState<any[]>([]);
  const noteEditorRef = React.useRef<HTMLDivElement>(null);
  const [bookmarkFilter, setBookmarkFilter] = useState('all');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [activeCohortId, setActiveCohortId] = useState<string | null>(initialCohortId);
  const [toast, setToast] = useState<string | null>(null);

  // Inline Edit State
  const [isUploading, setIsUploading] = useState(false);
  const [editingField, setEditingField] = useState<'dream_job' | 'learning_style' | 'full_name' | 'why_here' | 'community_serve' | null>(null);

  // Edit/Delete state for notes and generations
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [isEditingGeneration, setIsEditingGeneration] = useState(false);
  const [editGenTitle, setEditGenTitle] = useState('');
  const [editGenUrl, setEditGenUrl] = useState('');
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, kind: 'note' | 'prompt' | 'generation' | 'bookmark' | 'suggestion', percentage: number, title: string, isBookmark: boolean } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempMultiValue, setTempMultiValue] = useState<string[]>([]);
  const [otherValue, setOtherValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'dream_job' | 'learning_style' | 'community_serve' | null>(null);

  // Workforce Pathway Picks State
  const [workforcePicks, setWorkforcePicks] = useState<any[]>([]);
  const [loadingWorkforcePicks, setLoadingWorkforcePicks] = useState(false);
  
  // Certificate State - based on deliverables only (75% = eligible)
  // Use local state to allow client-side refresh (same API as Hub page uses)
  const [actualChiaProgress, setActualChiaProgress] = useState(chiaProgress);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [workshopCharacter, setWorkshopCharacter] = useState<any>(initialWorkshopCharacter);
  const [certSettings, setCertSettings] = useState({
    certOrg: 'StewardWorks',
    certFacilitator: 'Marisol Vega',
    certFacTitle: 'Program Director',
    certSponsor: 'Dr. Jane Smith',
    certSponsorOrg: 'SDSU Research Foundation',
    certMessage: ''
  });
  
  // Multi-cohort certificate support
  // Filter cohorts that are eligible (75% deliverables = all 3 approved)
  const eligibleCohorts = allCohortProgress.filter(c => c.isEligibleForCertificate);
  const [selectedCertCohortId, setSelectedCertCohortId] = useState<string | null>(
    eligibleCohorts.length > 0 ? eligibleCohorts[0].cohortId : null
  );
  const [certCohortDropdownOpen, setCertCohortDropdownOpen] = useState(false);
  
  // Get the selected cohort's progress data (includes workshopDays and progressRows)
  const selectedCertCohort = allCohortProgress.find(c => c.cohortId === selectedCertCohortId);
  
  // Get workshop days and progress for the selected certificate cohort
  // Fallback chain: selectedCertCohort -> first eligible cohort -> props
  const certWorkshopDays = selectedCertCohort?.workshopDays || 
    (eligibleCohorts.length > 0 ? eligibleCohorts[0].workshopDays : null) || 
    workshopDays;
  const certProgressRows = selectedCertCohort?.progressRows || 
    (eligibleCohorts.length > 0 ? eligibleCohorts[0].progressRows : null) || 
    progressRows;
  
  // Debug logging
  console.log('[ClientProfile] Certificate data:', {
    eligibleCohorts: eligibleCohorts.length,
    selectedCertCohortId,
    selectedCertCohort: selectedCertCohort?.cohortName,
    certWorkshopDaysCount: certWorkshopDays?.length,
    certProgressRowsCount: certProgressRows?.length,
    workshopDaysFromProps: workshopDays?.length,
  });
  
  // Certificate eligibility: at least one cohort has 75% deliverables
  const certificateEligible = eligibleCohorts.length > 0;
  
  // For display purposes, show the highest progress among all cohorts
  const highestProgress = allCohortProgress.length > 0 
    ? Math.max(...allCohortProgress.map(c => c.chiaProgress))
    : actualChiaProgress;

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

  const communityServeOptions = [
    "El Centro",
    "Calexico",
    "Brawley",
    "Imperial",
    "Holtville",
    "Calipatria",
    "Westmorland",
    "Heber",
    "Seeley",
    "Niland",
    "Salton City",
    "Bombay Beach",
    "Slab City",
    "Winterhaven",
    "Ocotillo",
    "Palo Verde",
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
          
          // Use NEW multi-cohort API structure
          // Engagements are in progressData.globalEngagement.items (not progressData.engagements)
          const engagements = progressData.globalEngagement?.items || [];
          console.log('[ClientProfile] Engagements array:', engagements);
          
          // Set active cohort from the API response
          if (progressData.selectedCohortId) {
            setActiveCohortId(progressData.selectedCohortId);
          }
          
          // Count approved engagements by kind
          const approved = engagements.filter((e: any) => e.status === 'approved');
          let showcaseBonusCount = 0;
          let studentShowcaseFormCount = 0;
          let normalGenerationCount = 0;
          
          approved.forEach((e: any) => {
            if (e.kind === 'generation') {
              if (e.source === 'Student Showcase') {
                studentShowcaseFormCount++;
              } else {
                normalGenerationCount++;
                if (e.content) {
                  try {
                    const contentData = JSON.parse(e.content);
                    if (contentData.showcaseVisible === true || contentData.showcaseRequested === true) {
                      showcaseBonusCount++;
                    }
                  } catch (err) {}
                }
              }
            } else {
              // For any other kind that might have showcase requested
              if (e.content) {
                try {
                  const contentData = JSON.parse(e.content);
                  if (contentData.showcaseVisible === true || contentData.showcaseRequested === true) {
                    showcaseBonusCount++;
                  }
                } catch (err) {}
              }
            }
          });
          
          setEngagementCounts({
            bookmarks: approved.filter((e: any) => e.kind === 'bookmark').length,
            notes: approved.filter((e: any) => e.kind === 'note').length,
            prompts: approved.filter((e: any) => e.kind === 'prompt').length,
            miniDeliverables: approved.filter((e: any) => e.kind === 'mini_deliverable').length,
            generations: normalGenerationCount,
            envSuggestions: approved.filter((e: any) => e.kind === 'env_suggestion').length,
            wfSuggestions: approved.filter((e: any) => e.kind === 'wf_suggestion').length,
            libSuggestions: approved.filter((e: any) => e.kind === 'lib_suggestion').length,
            showcase: showcaseBonusCount,
            showcaseForm: studentShowcaseFormCount,
          });
          
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
                created_at: e.created_at,
                content: e.content
              };
            });
          console.log('[ClientProfile] Mapped generation engagements:', generationEngagements);
          setGenerations(generationEngagements);

          // We now fetch env_suggestions from the dedicated API instead
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

          // Filter and set mini deliverables
          const miniDeliverableEngagements = engagements
            .filter((e: any) => e.kind === 'mini_deliverable')
            .map((e: any) => ({
              id: e.id,
              title: e.title,
              content: e.content || e.title,
              source: e.source || 'Workshops',
              status: e.status || 'pending',
              reviewNote: e.review_note || null,
              created_at: e.created_at
            }));
          setMiniDeliverables(miniDeliverableEngagements);

          // Filter and set workshop bookmarks
          const bookmarkEngagements = engagements
            .filter((e: any) => e.kind === 'bookmark' && !['library', 'workforce', 'environmental'].includes(e.source))
            .map((e: any) => ({
              id: e.id,
              title: e.title,
              url: e.url,
              source: e.source || 'Workshops',
              status: e.status || 'pending',
              reviewNote: e.review_note || null,
              created_at: e.created_at,
              cohort_id: e.cohort_id || progressData.selectedCohortId
            }));

          // Cross-check showcase bookmarks against active library resources.
          // If a showcase bookmark's url points to a library resource that has been deleted,
          // mark it as [UNAVAILABLE] so the profile shows the "Removed" card.
          try {
            const libRes = await fetch('/api/public/library-resources', { cache: 'no-store' });
            const libData = await libRes.json();
            const activeLibraryIds: Set<string> = new Set(
              (libData.resources || []).map((r: any) => r.id)
            );
            const checkedBookmarks = bookmarkEngagements.map((b: any) => {
              if (!b.url) return b;
              // Extract library resource UUID from URL like /hub/library/{uuid}
              const libraryMatch = b.url.match(/\/hub\/library\/([0-9a-fA-F-]{36})/);
              if (libraryMatch) {
                const resourceId = libraryMatch[1];
                if (!activeLibraryIds.has(resourceId)) {
                  // Resource has been deleted — mark as unavailable
                  return { ...b, title: `${b.title} [UNAVAILABLE]` };
                }
              }
              return b;
            });
            setWorkshopBookmarks(checkedBookmarks);
          } catch {
            // Fallback: set bookmarks without cross-check
            setWorkshopBookmarks(bookmarkEngagements);
          }
          
          // Use NEW multi-cohort API structure for progress calculation
          // The API already calculates totalProgress correctly (deliverables + engagement)
          // We use the API's totalProgress directly which matches Hub page calculation
          const totalProgress = progressData.totalProgress || 0;
          const globalEngPct = progressData.globalEngagement?.percentage || 0;
          
          // Get selected cohort's deliverable progress
          const selectedCohort = progressData.cohortProgress?.find(
            (c: any) => c.cohortId === progressData.selectedCohortId
          );
          const delivPct = selectedCohort?.deliverables?.percentage || 0;
          
          console.log('[ClientProfile] Progress calculation:', {
            totalProgress,
            globalEngPct,
            delivPct,
            selectedCohortId: progressData.selectedCohortId
          });
          
          // Use API's calculated total progress directly (same as Hub page)
          setActualChiaProgress(totalProgress);
          
          console.log('[ClientProfile] Chia progress calculated:', {
            delivPct,
            globalEngPct,
            totalProgress
          });
        }
      } catch (err) {
        console.error('Failed to load engagement counts:', err);
      }

      // Fetch environmental & workforce suggestions from dedicated API
      try {
        console.log('[ClientProfile] Fetching /api/user-suggestions');
        const envRes = await fetch('/api/user-suggestions');
        if (envRes.ok) {
          const envData = await envRes.json();
          console.log('[ClientProfile] User suggestions data:', envData);
          setEnvSuggestions((envData.suggestions || []).filter((s: any) => s.kind === 'env_suggestion'));
          setWfSuggestions((envData.suggestions || []).filter((s: any) => s.kind === 'wf_suggestion'));
          setLibSuggestions((envData.suggestions || []).filter((s: any) => s.kind === 'lib_suggestion'));
        } else {
          console.error('[ClientProfile] /api/user-suggestions failed:', envRes.statusText);
        }
      } catch (error) {
        console.error('[ClientProfile] Error fetching user suggestions:', error);
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
        const res = await fetch('/api/public/library-resources', { cache: 'no-store' });
        const data = await res.json();
        if (data.resources) {
          // Match bookmarks to resources - handle multiple URL formats:
          // New format: /hub/library/{uuid}
          // Legacy format: just the uuid
          // Older format: external URL
          const matched = data.resources.filter((r: any) => 
            libBookmarks.some((b: any) => {
              const itemId = b.item_id || '';
              return itemId === r.id || 
                     itemId === `/hub/library/${r.id}` || 
                     itemId === r.external_url;
            })
          );
          
          // For any bookmarks still unmatched, create placeholder cards from engagement data
          const matchedIds = new Set(matched.map((r: any) => r.id));
          const stillUnmatched = libBookmarks.filter((b: any) => {
            const itemId = b.item_id || '';
            return !matched.some((r: any) => 
              itemId === r.id || 
              itemId === `/hub/library/${r.id}` || 
              itemId === r.external_url
            );
          });
          const placeholders = stillUnmatched.map((b: any) => ({
            id: b.item_id || b.id,
            engagementId: b.id,
            title: `${b.title || 'Bookmarked Resource'} [UNAVAILABLE]`,
            external_url: b.item_id?.startsWith('http') ? b.item_id : '',
            body: '',
            category: null,
            media: [],
            created_at: new Date().toISOString(),
            bookmarkStatus: b.status || 'pending',
            reviewNote: b.review_note || null,
            _isDeleted: true
          }));
          
          // Attach status and review_note from bookmark engagement records
          const withStatus = matched.map((r: any) => {
            const bookmark = libBookmarks.find((b: any) => {
              const itemId = b.item_id || '';
              return itemId === r.id || 
                     itemId === `/hub/library/${r.id}` || 
                     itemId === r.external_url;
            });
            return {
              ...r,
              bookmarkStatus: bookmark?.status || 'approved',
              reviewNote: bookmark?.review_note || null,
              engagementId: bookmark?.id
            };
          });
          setBookmarkedResources([...withStatus, ...placeholders]);
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
            nodeId: b.content || null,
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
          url: b.item_id?.split('/').pop() || b.item_id,
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

  // Load certificate settings for the selected cohort
  const loadWorkshopData = useCallback(async () => {
    const cohortIdForCert = selectedCertCohortId || activeCohortId;
    if (!cohortIdForCert) return;
    
    try {
      // Fetch certificate settings if eligible (any cohort has 75% deliverables)
      if (certificateEligible) {
        try {
          const certResponse = await fetch(`/api/workshops/${cohortIdForCert}/certificate-settings`);
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
    } catch (error) {
      console.error('Failed to load workshop data:', error);
    }
  }, [activeCohortId, selectedCertCohortId, certificateEligible]);

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

  // Edit/Delete handlers for notes and generations
  const calculateItemPercentage = (kind: string, source: string, content: string | null, status?: string) => {
    if (status && status !== 'approved') return 0;
    let points = 0;
    const k = kind.toLowerCase();
    if (k === 'bookmark' || k === 'note') points = 1;
    else if (k === 'generation') points = 2;
    else if (k === 'prompt') points = 3;
    else if (k === 'mini_deliverable') points = 4;
    else if (['env_suggestion', 'wf_suggestion', 'lib_suggestion'].includes(k)) points = 2;

    if (k === 'generation' && source === 'Student Showcase') {
      points = 3;
    } else {
      if (content) {
        try {
          const contentData = JSON.parse(content);
          if (contentData.showcaseVisible === true || contentData.showcaseRequested === true) {
            points += 1;
          }
        } catch (err) {}
      }
    }
    return points;
  };

  const confirmDeleteEngagement = (id: string, kind: 'note' | 'prompt' | 'generation' | 'bookmark' | 'suggestion', title: string, isBookmark: boolean, source: string = '', content: string | null = null, customPercentage?: number, status?: string) => {
    setItemToDelete({
      id,
      kind,
      title,
      isBookmark,
      percentage: customPercentage !== undefined ? customPercentage : calculateItemPercentage(kind, source, content, status)
    });
  };

  const executeDeleteEngagement = async () => {
    if (!itemToDelete) return;
    const { id, kind, isBookmark } = itemToDelete;
    setIsDeletingItem(true);
    try {
      await removeEngagement(id);
      // Remove from local state
      setNotes(prev => prev.filter(n => n.id !== id));
      setPrompts(prev => prev.filter(p => p.id !== id));
      setGenerations(prev => prev.filter(g => g.id !== id));
      setWorkshopBookmarks(prev => prev.filter(b => b.id !== id));
      setBookmarkedResources(prev => prev.filter(b => b.engagementId !== id && b.id !== id));
      setBookmarkedWorkforce(prev => prev.filter(b => b.id !== id));
      setBookmarkedJobs(prev => prev.filter(b => b.id !== id));
      setBookmarkedEnvironmental(prev => prev.filter(b => b.id !== id));
      setEnvSuggestions(prev => prev.filter(s => s.id !== id));
      setWfSuggestions(prev => prev.filter(s => s.id !== id));
      setLibSuggestions(prev => prev.filter(s => s.id !== id));
      // Close popups
      setSelectedNoteItem(null);
      setSelectedResourceItem(null);
      setIsEditingNote(false);
      setIsEditingGeneration(false);
      setItemToDelete(null);
      // Reload to get updated engagement percentage
      await loadProfile();
      setToast(isBookmark ? `☆ Bookmark removed` : `🗑️ Item deleted`);
    } catch (err) {
      console.error('Failed to delete engagement:', err);
      setToast('❌ Failed to delete');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editNoteTitle.trim()) return;
    try {
      await updateEngagement(id, { title: editNoteTitle, content: editNoteContent });
      // Update local state
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title: editNoteTitle, content: editNoteContent } : n));
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, title: editNoteTitle, content: editNoteContent } : p));
      setIsEditingNote(false);
      setSelectedNoteItem(null);
      setToast('✏️ Updated successfully');
    } catch (err) {
      console.error('Failed to update note:', err);
      setToast('❌ Failed to update');
    }
  };

  const handleUpdateGeneration = async (id: string) => {
    if (!editGenTitle.trim()) return;
    try {
      await updateEngagement(id, { title: editGenTitle, url: editGenUrl });
      // Update local state
      setGenerations(prev => prev.map(g => g.id === id ? { ...g, title: editGenTitle, url: editGenUrl } : g));
      setIsEditingGeneration(false);
      setSelectedResourceItem(null);
      setToast('✏️ Generation updated');
    } catch (err) {
      console.error('Failed to update generation:', err);
      setToast('❌ Failed to update');
    }
  };

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
    if (field === 'learning_style' || field === 'community_serve') {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      const options = field === 'learning_style' ? learningStyleOptions : communityServeOptions;
      const hasCustom = currentArray.some((v: string) => !options.includes(v));
      const newTemp = currentArray.filter((v: string) => options.includes(v));
      if (hasCustom) newTemp.push("Other (please describe)");
      
      setTempMultiValue(newTemp);
      setOtherValue(hasCustom ? currentArray.find((v: string) => !options.includes(v)) || '' : '');
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
    if (editingField === 'learning_style' || editingField === 'community_serve') {
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
    if (option === "Other (please describe)") {
      if (tempMultiValue.includes(option)) {
        setTempMultiValue([]);
      } else {
        setTempMultiValue([option]);
      }
    } else {
      if (tempMultiValue.includes(option)) {
        setTempMultiValue(tempMultiValue.filter(v => v !== option));
      } else {
        setTempMultiValue([...tempMultiValue.filter(v => v !== "Other (please describe)"), option]);
      }
    }
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

  const currentCommunityServe = Array.isArray(profile?.community_serve) ? profile.community_serve : [];
  const displayCommunityServe = currentCommunityServe.length > 0
    ? currentCommunityServe.map((style: string) => communityServeOptions.includes(style) ? style : `Other: ${style}`).join(', ')
    : 'Add the communities you connect with, serve, and care about';

  const currentDreamJob = profile?.dream_job || "";
  const isDreamJobCustom = currentDreamJob && !dreamJobOptions.includes(currentDreamJob);
  const displayDreamJob = isDreamJobCustom ? `Other: ${currentDreamJob}` : (currentDreamJob || 'Add dream role');

  const handleNoteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadNoteImage(formData);
      setNoteImages(prev => [...prev, url]);
      setToast('Photo added');
    } catch (err) {
      console.error(err);
      setToast('✗ Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExecCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (noteEditorRef.current) {
      setNoteHtmlContent(noteEditorRef.current.innerHTML);
    }
  };

  const handleAddNote = async () => {
    const htmlContent = noteEditorRef.current?.innerHTML || noteHtmlContent || noteContent;
    const plainText = noteEditorRef.current?.innerText || noteContent;

    if (!noteTitle.trim() || !plainText.trim()) {
      setToast('⚠ Please enter both title and content');
      return;
    }
    
    if (!activeCohortId) {
      setToast('⚠ Unable to save note. Please refresh the page');
      return;
    }
    
    setIsSaving(true);
    try {
      const contentJson = JSON.stringify({
        version: 2,
        html: htmlContent,
        text: plainText,
        images: noteImages,
        subType: noteType
      });
      
      const kindToSave = isMiniDeliverable ? 'mini_deliverable' : noteType;
      
      await addEngagement(activeCohortId, kindToSave, noteTitle.trim(), 'Profile', '', contentJson);
      
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setNoteHtmlContent('');
      setNoteImages([]);
      setIsMiniDeliverable(false);
      setIsAddingNote(false);
      if (noteEditorRef.current) noteEditorRef.current.innerHTML = '';
      
      // Reload profile to get updated notes
      await loadProfile();
      
      if (isMiniDeliverable) {
        setToast(`🏆 Mini Deliverable submitted · pending admin approval`);
      } else {
        setToast(`📝 ${noteType === 'prompt' ? 'Prompt' : 'Note'} saved · pending admin approval`);
      }
    } catch (error: any) {
      console.error(`Failed to add ${noteType}:`, error);
      setToast(`✗ Failed to save ${isMiniDeliverable ? 'Mini Deliverable' : noteType}. Please try again`);
    } finally {
      setIsSaving(false);
    }
  };

  // Certificate download handler - based on deliverables only (75% = eligible)
  const handleDownloadCertificate = async () => {
    if (!certificateEligible || !profile) return;
    
    setIsDownloadingPDF(true);
    try {
      const playerName = profile.full_name || user?.fullName || 'Steward';
      const characterKey = workshopCharacter?.character_key || 'steward';
      const accent = workshopCharacter?.accent_color || '#ffd23f';
      
      // Get selected cohort name for filename
      const cohortName = selectedCertCohort?.cohortName || 'workshop';
      
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

      // Build deliverables data from the selected certificate cohort's workshop days
      // This matches how VictoryScreen builds deliverables for the PDF
      const deliverables = (certWorkshopDays || []).slice(0, 3).map((day: any, idx: number) => {
        const progress = (certProgressRows || []).find((p: any) => p.workshop_day_id === day.id);
        return {
          title: day.deliverable_title?.toUpperCase() || day.title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`,
          url: progress?.deliverable_url || ''
        };
      });

      // Call the certificate PDF API
      const response = await fetch('/api/certificate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          characterKey,
          cohortName: cohortName,
          certOrg: certSettings.certOrg,
          certFacilitator: certSettings.certFacilitator,
          certFacTitle: certSettings.certFacTitle,
          certSponsor: certSettings.certSponsor,
          certSponsorOrg: certSettings.certSponsorOrg,
          certMessage: certSettings.certMessage,
          deliverables: deliverables.length > 0 ? deliverables : [
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

      // Download the PDF with cohort name in filename
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${cohortName.replace(/\s+/g, '-')}-${playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
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
                    🌱 Learning style: {displayLearningStyle}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 206px), 1fr))', gap: '11px', marginTop: '22px' }}>
              
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
                    <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} autoFocus style={{ width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,.2)', border: '1px solid rgba(254,250,224,.2)', color: '#FEFAE0', borderRadius: '4px', fontSize: '12px', marginBottom: '8px', minHeight: '60px', fontFamily: 'inherit' }} placeholder="Add your goals and intentions..." />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSaveField} disabled={isSaving} style={{ flex: 1, background: '#FEFAE0', color: '#2c3742', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isSaving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingField(null)} style={{ background: 'transparent', color: '#FEFAE0', border: '1px solid rgba(254,250,224,.3)', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0', opacity: profile?.why_here ? 1 : 0.6 }}>
                    {profile?.why_here || 'Add your goals and intentions...'}
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
              <div className="custom-dropdown-container" style={{ background: 'rgba(254,250,224,.09)', border: '1px solid rgba(254,250,224,.16)', borderRadius: '13px', padding: '13px 15px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9.5px', letterSpacing: '.14em', color: 'rgba(254,250,224,.6)' }}>COMMUNITY I SERVE</span>
                  {openDropdown !== 'community_serve' && (
                    <button onClick={() => {
                      startEditing('community_serve', profile?.community_serve);
                      setOpenDropdown('community_serve');
                    }} style={{ background: 'none', border: 'none', color: 'rgba(254,250,224,.8)', fontSize: '10px', cursor: 'pointer', fontFamily: '"DM Mono", monospace' }}>Edit</button>
                  )}
                </div>
                
                <div style={{ fontSize: '14px', lineHeight: 1.4, color: '#FEFAE0' }}>{displayCommunityServe}</div>

                {openDropdown === 'community_serve' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#3f5460', borderRadius: '8px', padding: '10px', color: '#FEFAE0', boxShadow: '0 10px 25px rgba(0,0,0,.3)', marginTop: '4px', border: '1px solid rgba(254,250,224,.16)', maxHeight: '300px', overflowY: 'auto' }}>
                    {communityServeOptions.map(opt => {
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
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
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.18em', color: '#8a5a2e' }}>ENGAGEMENT PROGRESS <span style={{ fontSize: '10px', letterSpacing: '.08em', color: '#6b4e2e' }}>(for Overall Progress, go to My Chia page)</span></span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#356074' }}>{engagementProgress}% <span style={{ fontSize: '12px', fontWeight: 400, color: '#8a6a4a' }}>/ 25% cap</span></span>
          </div>
          <div style={{ height: '12px', background: 'rgba(33,40,46,.08)', borderRadius: '8px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ width: `${Math.min((engagementProgress / 25) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#417C98,#65a6c4)' }}></div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
            {engagementCounts.bookmarks > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#417C98' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Bookmark saved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.bookmarks}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.bookmarks * 1}%</span>
              </div>
            )}
            {engagementCounts.notes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#A27532' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Note created</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.notes}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.notes * 1}%</span>
              </div>
            )}
            {engagementCounts.prompts > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#DB9B2F' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Prompt saved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.prompts}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.prompts * 3}%</span>
              </div>
            )}
            {engagementCounts.miniDeliverables > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#7c5cbf' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Mini Deliverable</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.miniDeliverables}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.miniDeliverables * 4}%</span>
              </div>
            )}
            {engagementCounts.generations > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#2E5534' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Generation created</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.generations}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.generations * 2}%</span>
              </div>
            )}
            {engagementCounts.envSuggestions > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#4B8B9B' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Environmental suggestion approved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.envSuggestions}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.envSuggestions * 2}%</span>
              </div>
            )}
            {engagementCounts.wfSuggestions > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#2E5534' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Workforce suggestion approved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.wfSuggestions}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.wfSuggestions * 2}%</span>
              </div>
            )}
            {engagementCounts.libSuggestions > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#417C98' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Library suggestion approved</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.libSuggestions}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.libSuggestions * 2}%</span>
              </div>
            )}
            {engagementCounts.showcase > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#65a6c4' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Student showcase bonus</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.showcase}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.showcase * 1}%</span>
              </div>
            )}
            {engagementCounts.showcaseForm > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', flex: 'none', background: '#65a6c4' }}></span>
                <span style={{ fontSize: '13px', color: '#3a2412' }}>Student showcase</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#7a5a3a', marginLeft: '4px' }}>x{engagementCounts.showcaseForm}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '12px', fontWeight: 600, color: '#2E5534' }}>+{engagementCounts.showcaseForm * 3}%</span>
              </div>
            )}
            {engagementCounts.bookmarks === 0 && engagementCounts.notes === 0 && engagementCounts.prompts === 0 && engagementCounts.miniDeliverables === 0 && engagementCounts.generations === 0 && engagementCounts.envSuggestions === 0 && engagementCounts.wfSuggestions === 0 && engagementCounts.libSuggestions === 0 && engagementCounts.showcase === 0 && engagementCounts.showcaseForm === 0 && (
              <div style={{ padding: '20px', width: '100%', textAlign: 'center', color: '#8a6a4a', fontSize: '13px' }}>
                No approved engagements yet. Submit work in the Portfolio to earn rewards!
              </div>
            )}
          </div>
        </div>

        {/* ======================= */}
        {/* SAVED RESOURCES SECTION */}
        {/* ======================= */}
        <div style={{ background: '#F5ECE3', border: '1.5px solid rgba(138,90,46,.15)', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
          
          {/* HEADER & LEGEND */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '16px', letterSpacing: '.15em', color: '#3a2412', margin: '0 0 6px 0', fontWeight: 700 }}>SAVED RESOURCES</h2>
              <p style={{ fontSize: '13px', color: '#7a5a3a', margin: 0 }}>All your bookmarks collected from across the StewardWorks hub.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All', color: '#3a2412', count: bookmarkedResources.length + workshopBookmarks.length + bookmarkedWorkforce.length + bookmarkedJobs.length + bookmarkedEnvironmental.length },
                { key: 'library', label: 'Library', color: '#417C98', count: bookmarkedResources.length },
                { key: 'workshops', label: 'Workshops', color: '#A27532', count: workshopBookmarks.length },
                { key: 'workforce', label: 'Workforce', color: '#2E5534', count: bookmarkedWorkforce.length },
                { key: 'jobs', label: 'Jobs', color: '#ff6a2e', count: bookmarkedJobs.length },
                { key: 'environmental', label: 'Environmental', color: '#4B8B9B', count: bookmarkedEnvironmental.length },
              ].filter(c => c.key === 'all' || c.count > 0).map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setBookmarkFilter(cat.key)}
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '10px',
                    letterSpacing: '.06em',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: bookmarkFilter === cat.key ? `2px solid ${cat.color}` : '1.5px solid rgba(138,90,46,.15)',
                    background: bookmarkFilter === cat.key ? `${cat.color}18` : 'rgba(255,255,255,0.5)',
                    color: bookmarkFilter === cat.key ? cat.color : '#5a4a3a',
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {cat.key !== 'all' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, display: 'inline-block', marginRight: '5px', verticalAlign: 'middle' }}></span>}
                  {cat.label} {cat.count > 0 && <span style={{ opacity: 0.7 }}>({cat.count})</span>}
                </button>
              ))}
            </div>
          </div>

          {isFetchingResources ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading your shelf...</div>
          ) : (bookmarkedResources.length === 0 && workshopBookmarks.length === 0 && bookmarkedWorkforce.length === 0 && bookmarkedJobs.length === 0 && bookmarkedEnvironmental.length === 0) ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: 'rgba(255,255,255,0.4)', border: '1.5px dashed rgba(138,90,46,.15)', borderRadius: '13px' }}>
              No saved resources yet. Explore the hub and bookmark content to build your personal repository!
            </div>
          ) : (
            <>
              {/* 1. LIBRARY */}
              {bookmarkedResources.length > 0 && (bookmarkFilter === 'all' || bookmarkFilter === 'library') && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#417C98', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    STEWARD LIBRARY <span style={{ background: 'rgba(65,124,152,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedResources.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                    {bookmarkedResources.map(b => {
                      const isUnavailable = b.title && b.title.endsWith('[UNAVAILABLE]');
                      const cleanTitle = isUnavailable ? b.title.replace(' [UNAVAILABLE]', '') : b.title;
                      if (isUnavailable) return (
                        <div key={b.id} style={{ background: 'repeating-linear-gradient(135deg,#f8f0e8,#f8f0e8 6px,#fdf5eb 6px,#fdf5eb 12px)', border: '1.5px dashed rgba(180,130,80,.35)', borderRadius: '13px', padding: '15px 16px', boxShadow: 'none', opacity: 0.85 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#9E9E9E', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>LIBRARY</span>
                            <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#c0392b', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REMOVED</span>
                          </div>
                          <div style={{ fontSize: '22px', marginBottom: '4px' }}>🗑️</div>
                          <div style={{ fontWeight: 700, color: '#9a8a7a', fontSize: '13px', lineHeight: 1.3, textDecoration: 'line-through', marginBottom: '6px' }}>{cleanTitle}</div>
                          <div style={{ fontSize: '11px', color: '#b09070', lineHeight: 1.5, marginBottom: '12px' }}>This resource has been removed by an admin and is no longer available.</div>
                          <button
                            onClick={() => confirmDeleteEngagement(b.engagementId || b.id, 'bookmark', cleanTitle, true, 'library', null, 0, b.bookmarkStatus)}
                            style={{ fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '.08em', background: 'rgba(192,57,43,.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,.25)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}
                          >
                            ✕ Remove from Profile
                          </button>
                        </div>
                      );
                      return (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#EBF4F8', border: '1.5px solid rgba(65,124,152,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={() => setSelectedResourceItem({ ...b, _kind: 'LIBRARY', _color: '#417C98', _bg: '#EBF4F8', _url: (b.id?.startsWith('http') || b.id?.startsWith('/')) ? b.id : `/hub/library/${b.id}`, _status: b.bookmarkStatus, _source: domain(b.external_url || b.url), _isUnavailable: false })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#417C98', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>LIBRARY</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#2a4a5a', fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-all' }}>{b.title}</div>
                        <div style={{ fontSize: '12px', color: '#5a8a9a', marginTop: '7px' }}>{domain(b.external_url || b.url)}</div>
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {/* 2. WORKSHOPS */}
              {workshopBookmarks.length > 0 && (bookmarkFilter === 'all' || bookmarkFilter === 'workshops') && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#A27532', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    WORKSHOPS <span style={{ background: 'rgba(162,117,50,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{workshopBookmarks.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                    {workshopBookmarks.map(b => {
                      const isStudentShowcase = b.source?.toLowerCase().includes('student');
                      const isContributor = b.source?.toLowerCase().includes('showcase') && !isStudentShowcase;
                      const tagLabel = isStudentShowcase ? 'STUDENT SHOWCASE' : isContributor ? 'CONTRIBUTOR' : 'WORKSHOP';
                      const tagColor = isStudentShowcase ? '#ff5fd2' : isContributor ? '#45d6ff' : '#A27532';
                      const isUnavailable = b.title && b.title.endsWith('[UNAVAILABLE]');
                      const cleanTitle = isUnavailable ? b.title.replace(' [UNAVAILABLE]', '') : b.title;
                      if (isUnavailable) return (
                        <div key={b.id} style={{ background: 'repeating-linear-gradient(135deg,#f8f0e8,#f8f0e8 6px,#fdf5eb 6px,#fdf5eb 12px)', border: '1.5px dashed rgba(180,130,80,.35)', borderRadius: '13px', padding: '15px 16px', boxShadow: 'none', opacity: 0.85 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#9E9E9E', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>{tagLabel}</span>
                            <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#c0392b', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REMOVED</span>
                          </div>
                          <div style={{ fontSize: '22px', marginBottom: '4px' }}>🗑️</div>
                          <div style={{ fontWeight: 700, color: '#9a8a7a', fontSize: '13px', lineHeight: 1.3, textDecoration: 'line-through', marginBottom: '6px' }}>{cleanTitle}</div>
                          <div style={{ fontSize: '11px', color: '#b09070', lineHeight: 1.5, marginBottom: '12px' }}>This resource has been removed by an admin and is no longer available.</div>
                          <button
                            onClick={() => confirmDeleteEngagement(b.id, 'bookmark', cleanTitle, false, b.source || '', null, 0, b.status)}
                            style={{ fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '.08em', background: 'rgba(192,57,43,.08)', color: '#c0392b', border: '1px solid rgba(192,57,43,.25)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}
                          >
                            ✕ Remove from Profile
                          </button>
                        </div>
                      );
                      return (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FDF8ED', border: '1.5px solid rgba(162,117,50,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={() => setSelectedResourceItem({ ...b, _kind: tagLabel, _color: tagColor, _bg: '#FDF8ED', _url: b.url, _status: b.status, _source: b.source, _cohortId: b.cohort_id, content: b.content || b.note || '', _isUnavailable: false })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: tagColor, color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>{tagLabel}</span>
                          {b.status === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.status === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.status === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#4a3a2a', fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-all' }}>
                          {(() => {
                            let displayTitle = b.title;
                            if (displayTitle && displayTitle.includes('/library/')) {
                              displayTitle = 'Library Resource';
                            } else if (displayTitle && displayTitle.match(/^[0-9a-fA-F-]{36}$/)) {
                              displayTitle = 'Bookmarked Resource';
                            } else if (displayTitle && displayTitle.includes('/workforce-pathways')) {
                              displayTitle = 'Workforce Pathway';
                            } else if (displayTitle && displayTitle.startsWith('http')) {
                              try {
                                displayTitle = new URL(displayTitle).hostname;
                              } catch {
                                // ignore
                              }
                            }
                            return displayTitle;
                          })()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#A27532', marginTop: '7px' }}>🔖 {b.source}</div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. WORKFORCE PATHWAYS */}
              {bookmarkedWorkforce.length > 0 && (bookmarkFilter === 'all' || bookmarkFilter === 'workforce') && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#2E5534', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    WORKFORCE PATHWAYS <span style={{ background: 'rgba(46,85,52,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedWorkforce.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                    {bookmarkedWorkforce.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#EAF2EB', border: '1.5px solid rgba(46,85,52,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={() => setSelectedResourceItem({ ...b, _kind: 'WORKFORCE', _color: '#2E5534', _bg: '#EAF2EB', _url: b.url, _vaultUrl: b.nodeId ? `/hub/workforce-pathways?node=${b.nodeId}` : `/hub/workforce-pathways`, _status: b.bookmarkStatus, _source: b.source || domain(b.url) })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#2E5534', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>VAULT</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#1a2a1a', fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-all' }}>{b.title}</div>
                        <div style={{ fontSize: '12px', color: '#3a5a4a', marginTop: '7px' }}>{b.source || domain(b.url)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. JOBS QUEST */}
              {bookmarkedJobs.length > 0 && (bookmarkFilter === 'all' || bookmarkFilter === 'jobs') && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#ff6a2e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    JOBS QUEST <span style={{ background: 'rgba(255,106,46,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedJobs.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                    {bookmarkedJobs.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FFF0E6', border: '1.5px solid rgba(255,106,46,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={() => setSelectedResourceItem({ ...b, title: b.title.replace(/^Job:\s*/, ''), _kind: 'JOB', _color: '#ff6a2e', _bg: '#FFF0E6', _url: b.url || '/hub/workforce-pathways?jobs=true#wf-jobs', _status: b.bookmarkStatus, _source: b.source, _viewLabel: b.url ? 'Apply →' : 'View Jobs →' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff6a2e', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>JOB</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#4a2a1a', fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-all' }}>{b.title.replace(/^Job:\s*/, '')}</div>
                        <div style={{ fontSize: '12px', color: '#8a4a2a', marginTop: '7px' }}>{b.source}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. FIELD NOTES */}
              {bookmarkedEnvironmental.length > 0 && (bookmarkFilter === 'all' || bookmarkFilter === 'environmental') && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#4B8B9B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ENVIRONMENTAL BOOKMARKS <span style={{ background: 'rgba(75,139,155,.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>{bookmarkedEnvironmental.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                    {bookmarkedEnvironmental.map(b => (
                      <div key={b.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#EAF3F5', border: '1.5px solid rgba(75,139,155,.2)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.04)', cursor: 'pointer' }} onClick={() => setSelectedResourceItem({ ...b, _kind: 'ENVIRONMENTAL', _color: '#4B8B9B', _bg: '#EAF3F5', _url: `/hub/environmental-literacy?entry=${b.url}`, _status: b.bookmarkStatus, _source: b.source })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#4B8B9B', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>ENVIRONMENTAL</span>
                          {b.bookmarkStatus === 'pending' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>}
                          {b.bookmarkStatus === 'approved' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED</span>}
                          {b.bookmarkStatus === 'rejected' && <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>}
                        </div>
                        <div style={{ fontWeight: 700, color: '#1a3a4a', fontSize: '15px', lineHeight: 1.3, wordBreak: 'break-all' }}>{b.title}</div>
                        <div style={{ fontSize: '12px', color: '#3a6a7a', marginTop: '7px' }}>{b.source}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 240px), 1fr))', gap: '12px', marginBottom: '30px' }}>
            {generations.map(g => {
              // Check if URL is an image based on extension (allow query params) or path patterns
              const isImageUrl = g.url && (
                /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|#|$)/i.test(g.url) ||
                /\/(uploads|images|content-uploads)\//i.test(g.url) ||
                (g.url.includes('supabase') && g.url.includes('/storage/') && !/\.(mp4|webm|mov|mp3|wav|ogg)/i.test(g.url))
              );
              
              // Derive type tag from URL
              const isVideo = g.url && /\.(mp4|webm|mov)(\?|#|$)/i.test(g.url);
              const isAudio = g.url && /\.(mp3|wav|ogg|aac|flac)(\?|#|$)/i.test(g.url);
              const typeTag = isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : isImageUrl ? 'IMAGE' : 'LINK';

              let isShowcaseApproved = false;
              if (g.content) {
                try {
                  const contentData = JSON.parse(g.content);
                  if (contentData.showcaseVisible === true) {
                    isShowcaseApproved = true;
                  }
                } catch (e) {}
              }

              return (
                <div key={g.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '0', boxShadow: '0 8px 18px rgba(0,0,0,.06)', overflow: 'hidden', cursor: 'pointer', minWidth: 0 }} onClick={() => setSelectedResourceItem({ ...g, _kind: 'GENERATION', _color: '#45d6ff', _bg: '#FEFAE0', _url: g.url, _status: g.status, _source: g.source, _typeTag: typeTag, _isImageUrl: isImageUrl })}>
                  {/* Media Preview - Full width at top */}
                  {isImageUrl && g.url && (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(69,214,255,.08),rgba(116,240,160,.08))', position: 'relative' }}>
                      <img 
                        src={g.url} 
                        alt={g.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { 
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#7a5a3a;font-size:32px;">🖼️</div>';
                          }
                        }} 
                      />
                    </div>
                  )}
                  {isVideo && g.url && (
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#1a1a2e', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video src={g.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '18px', color: '#fff', marginLeft: 3 }}>▶</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {isAudio && g.url && (
                    <div style={{ width: '100%', height: '80px', overflow: 'hidden', background: 'linear-gradient(135deg,rgba(116,240,160,.1),rgba(69,214,255,.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                      <audio src={g.url} controls style={{ width: '90%' }} />
                    </div>
                  )}
                  
                  {/* Content Padding */}
                  <div style={{ padding: '15px 16px', minWidth: 0 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {g.source === 'Student Showcase' ? (
                        <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#7c5cbf', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>🌟 STUDENT SHOWCASE</span>
                      ) : (
                        <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: 'linear-gradient(135deg,#45d6ff,#74f0a0)', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>GENERATION</span>
                      )}
                      {isShowcaseApproved && g.source !== 'Student Showcase' && (
                        <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#7c5cbf', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>🌟 SHOWCASE APPROVED</span>
                      )}
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
                    
                    {/* Title - truncated */}
                    <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                    
                    {/* Type & Source */}
                    <div style={{ fontSize: '11px', color: '#7a5a3a', marginBottom: '10px' }}>
                      {typeTag === 'IMAGE' && '🖼️ IMAGE'}
                      {typeTag === 'VIDEO' && '🎥 VIDEO'}
                      {typeTag === 'AUDIO' && '🎵 AUDIO'}
                      {typeTag === 'LINK' && '🔗 LINK'}
                      {' · '}{g.source}
                    </div>
                    
                    {/* Link Display - if not a recognized media, show the link */}
                    {!isImageUrl && !isVideo && !isAudio && g.url && (
                      <div style={{ padding: '10px', background: 'rgba(69,214,255,.06)', border: '1px solid rgba(69,214,255,.15)', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.1em', color: '#417C98', marginBottom: '4px' }}>SUBMITTED LINK</div>
                        <a 
                          href={g.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: '12px', color: '#45d6ff', wordBreak: 'break-all', lineHeight: 1.4, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          className="hover:underline"
                        >
                          {g.url}
                        </a>
                      </div>
                    )}
                    

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SUGGESTION ENGAGEMENTS */}
        {(envSuggestions.length > 0 || wfSuggestions.length > 0 || libSuggestions.length > 0) && (() => {
          const allSuggestions = [...envSuggestions, ...wfSuggestions, ...libSuggestions].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          
          return (
            <div style={{ background: '#F5ECE3', border: '1.5px solid rgba(138,90,46,.15)', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '16px', letterSpacing: '.15em', color: '#3a2412', margin: '0 0 6px 0', fontWeight: 700 }}>SUGGESTION ENGAGEMENTS</h2>
                  <p style={{ fontSize: '13px', color: '#7a5a3a', margin: 0 }}>All your community submissions from across the StewardWorks hub. ({allSuggestions.length} total)</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '15px' }}>
                {allSuggestions.map(s => {
                  const isEnv = s.kind === 'env_suggestion';
                  const isWf = s.kind === 'wf_suggestion';
                  const isLib = s.kind === 'lib_suggestion';
                  
                  const badgeText = isEnv ? 'ENV. LITERACY' : isWf ? 'PATHWAYS' : 'LIBRARY';
                  const badgeBg = isEnv ? '#4B8B9B' : isWf ? '#417C98' : '#A27532';
                  
                  return (
                    <div key={s.id} className="hover:-translate-y-1 hover:shadow-lg transition-all" style={{
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: badgeBg,
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontWeight: 700
                        }}>
                          {badgeText}
                        </div>
                        
                        {s.status === 'pending' ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#FFF9C4',
                            color: '#F57F17',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 700
                          }}>
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#F57F17' }}></span>
                            Pending
                          </div>
                        ) : s.status === 'approved' ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#bcf2cb',
                            color: '#2e8c46',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 700
                          }}>
                            ✓ APPROVED +2%
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ff8a4a',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 700
                          }}>
                            ✕ REJECTED
                          </div>
                        )}
                      </div>
                      
                      <h5 style={{ fontSize: '15px', color: '#1a1f36', fontWeight: 600, marginBottom: '8px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </h5>
                      <div style={{ fontSize: '12px', color: '#6A7E8A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🌿 {s.source}
                      </div>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '10px', color: '#417C98', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.url}
                        </a>
                      )}
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: (s.status === 'approved' && s.library_item_id) ? 'space-between' : 'flex-end', alignItems: 'center' }}>
                        {s.status === 'approved' && s.library_item_id && (
                          <a href={`/hub/library/${s.library_item_id}`} style={{ display: 'inline-block', background: '#2E5534', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>
                            View in Library ➔
                          </a>
                        )}

                        <button 
                          onClick={() => confirmDeleteEngagement(s.id, 'suggestion', s.title, false, s.source || '', null, s.status === 'approved' ? 2 : 0, s.status)}
                          disabled={isDeletingItem && itemToDelete?.id === s.id}
                          style={{
                            background: 'none', border: 'none', color: '#b56d6d', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: (isDeletingItem && itemToDelete?.id === s.id) ? 0.5 : 1
                          }}
                        >
                          {(isDeletingItem && itemToDelete?.id === s.id) ? '⏳' : '🗑️'} Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}


        {/* PROMPT AND PATTERN LIBRARY */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.2em', color: '#8a5a2e' }}>PROMPT AND PATTERN LIBRARY</span>
            <span style={{ fontSize: '12px', color: '#8a6a4a', fontStyle: 'italic' }}>(save your prompts, notes, patterns, and mini-deliverables here)</span>
            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#b89050' }}>{notes.length + prompts.length + miniDeliverables.length}</span>
            <span style={{ fontSize: '12px', color: '#8a6a4a' }}>from workshops & the AI Lab</span>
          </div>
          <button onClick={() => setIsAddingNote(true)} style={{ background: '#3f5460', color: '#FEFAE0', border: 'none', borderRadius: '9px', padding: '9px 16px', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '12px' }}>+ New note</button>
        </div>
        
        {isFetchingResources ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8a6a4a' }}>Loading...</div>
        ) : (notes.length === 0 && prompts.length === 0 && miniDeliverables.length === 0) ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8a6a4a', background: '#FEFAE0', border: '1.5px dashed rgba(33,40,46,.15)', borderRadius: '13px' }}>
            No notes, prompts, or mini deliverables yet. Add them from the <Link href="/hub/pilot-workshops" style={{ color: '#417C98', textDecoration: 'underline' }}>Workshops</Link> or <Link href="/hub/ai-lab" style={{ color: '#417C98', textDecoration: 'underline' }}>AI Lab</Link>!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
            {/* Notes */}
            {notes.map(n => (
              <div
                key={n.id}
                onClick={() => setSelectedNoteItem({ ...n, itemType: 'note' })}
                className="hover:-translate-y-1 hover:shadow-lg transition-all"
                style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)', cursor: 'pointer' }}
              >
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
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{n.title}</div>
                {n.content && n.content !== n.title && (
                  <div style={{ fontSize: '13px', color: '#5a4a3a', lineHeight: 1.5, marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                    {n.content.length > 100 ? n.content.slice(0, 100) + '…' : n.content}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#7a5a3a' }}>📝 {n.source?.startsWith('workshop:') ? 'Workshop Portfolio' : n.source}</div>
              </div>
            ))}
            
            {/* Prompts */}
            {prompts.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedNoteItem({ ...p, itemType: 'prompt' })}
                className="hover:-translate-y-1 hover:shadow-lg transition-all"
                style={{ background: '#FEFAE0', border: '1.5px solid rgba(33,40,46,.1)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(0,0,0,.06)', cursor: 'pointer' }}
              >
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
                <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{p.title}</div>
                {p.content && p.content !== p.title && (
                  <div style={{ fontSize: '13px', color: '#5a4a3a', lineHeight: 1.5, marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                    {p.content.length > 100 ? p.content.slice(0, 100) + '…' : p.content}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#7a5a3a' }}>⌘ {p.source?.startsWith('workshop:') ? 'Workshop Portfolio' : p.source}</div>
              </div>
            ))}

            {/* Mini Deliverables */}
            {miniDeliverables.map(m => {
              const parsed = parseNoteContent(m.content);
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedNoteItem({ ...m, itemType: 'mini_deliverable' })}
                  className="hover:-translate-y-1 hover:shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, #f3ebfc 0%, #FEFAE0 100%)', border: '1.5px solid rgba(124,92,191,.3)', borderRadius: '13px', padding: '15px 16px', boxShadow: '0 8px 18px rgba(124,92,191,.1)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#7c5cbf', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>🏆 MINI DELIVERABLE</span>
                    {(() => {
                      const t = parsed.noteType || parsed.subType || parsed.originalKind || 'note';
                      if (t === 'prompt') return <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#fad0e9', color: '#7a2955', padding: '3px 8px', borderRadius: '20px' }}>⌘ PROMPT</span>;
                      return <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#e8dbb0', color: '#5a4a3a', padding: '3px 8px', borderRadius: '20px' }}>✎ NOTE</span>;
                    })()}
                    {m.status === 'pending' && (
                      <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 8px', borderRadius: '20px' }}>PENDING</span>
                    )}
                    {m.status === 'approved' && (
                      <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 8px', borderRadius: '20px' }}>✓ APPROVED +4%</span>
                    )}
                    {m.status === 'rejected' && (
                      <span style={{ display: 'inline-block', fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>✕ REJECTED</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '15px', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{m.title}</div>
                  
                  {parsed.images && parsed.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,0,0,.1)' }}>
                        <img src={parsed.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Mini deliverable attachment" />
                      </div>
                      {parsed.images.length > 1 && (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#7a5a3a' }}>
                          +{parsed.images.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {parsed.text && parsed.text !== m.title && (
                    <div style={{ fontSize: '13px', color: '#5a4a3a', lineHeight: 1.5, marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                      {parsed.text.length > 100 ? parsed.text.slice(0, 100) + '…' : parsed.text}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#7a5a3a', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{parsed.subType === 'prompt' ? '⌘' : '📝'} {m.source?.startsWith('workshop:') ? 'Workshop Portfolio' : m.source}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      
      {/* Note / Prompt Detail Popup */}
      {selectedNoteItem && (
        <div
          onClick={() => { setSelectedNoteItem(null); setIsEditingNote(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(20,12,4,.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(12px,4vw,40px)',
            animation: 'fadeIn .18s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560,
              background: '#FEFAE0',
              border: '2px solid rgba(162,117,50,.25)',
              borderRadius: '18px',
              padding: 'clamp(22px,4vw,36px)',
              boxShadow: '0 24px 60px rgba(0,0,0,.28)',
              position: 'relative',
              maxHeight: '88vh', overflowY: 'auto',
              animation: 'slideUp .2s ease'
            }}
          >
            {/* Close */}
            <button
              onClick={() => { setSelectedNoteItem(null); setIsEditingNote(false); }}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'rgba(162,117,50,.1)', border: '1.5px solid rgba(162,117,50,.3)',
                color: '#8a5a2e', borderRadius: '50%', width: 30, height: 30,
                cursor: 'pointer', fontSize: '14px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                lineHeight: 1
              }}
            >✕</button>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {selectedNoteItem.itemType === 'mini_deliverable' ? (
                <>
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#7c5cbf', color: '#fff', padding: '3px 9px', borderRadius: '20px' }}>🏆 MINI DELIVERABLE</span>
                  {(() => {
                    const popupParsed = parseNoteContent(selectedNoteItem.content);
                    const t = popupParsed.noteType || popupParsed.subType || popupParsed.originalKind || 'note';
                    if (t === 'prompt') return <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#fad0e9', color: '#7a2955', padding: '3px 9px', borderRadius: '20px' }}>⌘ PROMPT</span>;
                    return <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#e8dbb0', color: '#5a4a3a', padding: '3px 9px', borderRadius: '20px' }}>✎ NOTE</span>;
                  })()}
                </>
              ) : selectedNoteItem.itemType === 'note' ? (
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#A27532', color: '#fff', padding: '3px 9px', borderRadius: '20px' }}>NOTE</span>
              ) : (
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#DB9B2F', color: '#fff', padding: '3px 9px', borderRadius: '20px' }}>PROMPT</span>
              )}
              {selectedNoteItem.status === 'pending' && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ffd23f', color: '#3a2412', padding: '3px 9px', borderRadius: '20px' }}>PENDING</span>}
              {selectedNoteItem.status === 'approved' && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#74f0a0', color: '#1a3a1e', padding: '3px 9px', borderRadius: '20px' }}>✓ APPROVED {selectedNoteItem.itemType === 'mini_deliverable' && '+4%'}</span>}
              {selectedNoteItem.status === 'rejected' && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#ff8a4a', color: '#fff', padding: '3px 9px', borderRadius: '20px' }}>✕ REJECTED</span>}
            </div>

            {isEditingNote ? (
              <>
                {/* Edit mode */}
                <input
                  value={editNoteTitle}
                  onChange={e => setEditNoteTitle(e.target.value)}
                  placeholder="Title"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '16px', fontWeight: 700, color: '#3a2412', border: '1.5px solid rgba(162,117,50,.3)', borderRadius: '8px', background: '#fff', marginBottom: '12px', fontFamily: 'inherit' }}
                />
                
                <div style={{ border: '1.5px solid rgba(162,117,50,.3)', borderRadius: '8px', background: '#fff', overflow: 'hidden', marginBottom: '14px' }}>
                  <RichTextEditor
                    content={editNoteContent || ''}
                    onChange={(html) => setEditNoteContent(html)}
                    onUpload={async (formData) => {
                      const res = await uploadNoteImage(formData);
                      return { publicUrl: res, type: 'image' };
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleUpdateNote(selectedNoteItem.id)} style={{ padding: '10px 18px', background: '#2E5534', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setIsEditingNote(false)} style={{ padding: '10px 18px', background: 'transparent', color: '#5c4f3c', border: '1.5px solid rgba(138,90,46,.25)', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            ) : (() => {
              const popupParsed = parseNoteContent(selectedNoteItem.content);
              return (
                <>
                  {/* Title */}
                  <div style={{ fontWeight: 800, color: '#3a2412', fontSize: 'clamp(17px,2vw,21px)', lineHeight: 1.3, marginBottom: '14px' }}>
                    {selectedNoteItem.title}
                  </div>
  
                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(162,117,50,.18)', marginBottom: '16px' }} />
  
                  {/* Full content */}
                  {popupParsed.version === 2 ? (
                    <div style={{ fontSize: '14px', color: '#4a3822', lineHeight: 1.75, marginBottom: '18px' }} dangerouslySetInnerHTML={{ __html: popupParsed.html }} />
                  ) : (
                    selectedNoteItem.content && selectedNoteItem.content !== selectedNoteItem.title && (
                      <div style={{ fontSize: '14px', color: '#4a3822', lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '18px' }}>
                        {selectedNoteItem.content}
                      </div>
                    )
                  )}
                  
                  {/* Images Gallery */}
                  {popupParsed.images && popupParsed.images.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                      {popupParsed.images.map((img: string, idx: number) => (
                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,.1)' }}>
                          <img src={img} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ))}
                    </div>
                  )}
  
                  {/* Source */}
                  <div style={{ fontSize: '11px', color: '#7a5a3a', fontFamily: '"DM Mono", monospace', letterSpacing: '.06em', marginBottom: selectedNoteItem.reviewNote ? '14px' : 0 }}>
                    {selectedNoteItem.itemType === 'note' ? '📝' : '⌘'} {selectedNoteItem.source?.startsWith('workshop:') ? 'Workshop Portfolio' : selectedNoteItem.source}
                  </div>

                {/* Admin review note */}
                {selectedNoteItem.reviewNote && (
                  <div style={{ padding: '12px 14px', background: 'rgba(162,117,50,.08)', border: '1px solid rgba(162,117,50,.22)', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.12em', color: '#8a5a2e', marginBottom: '6px' }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#3a2412' }}>{selectedNoteItem.reviewNote}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {selectedNoteItem.source?.startsWith('workshop:') && (
                    <button
                      onClick={() => window.open(`/hub/pilot-workshops/${selectedNoteItem.source.split(':')[1]}/journey?tab=portfolio`, '_blank')}
                      style={{ padding: '9px 16px', background: '#2E5534', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                    >View in Portfolio ↗</button>
                  )}
                  <button
                    onClick={() => { setEditNoteTitle(selectedNoteItem.title); setEditNoteContent(selectedNoteItem.content || ''); setIsEditingNote(true); }}
                    style={{ padding: '9px 16px', background: 'rgba(162,117,50,.1)', color: '#8a5a2e', border: '1.5px solid rgba(162,117,50,.3)', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '11px', cursor: 'pointer' }}
                  >✏️ Edit</button>
                  <button
                    onClick={() => confirmDeleteEngagement(selectedNoteItem.id, selectedNoteItem.itemType, selectedNoteItem.title, false, selectedNoteItem.source || '', selectedNoteItem.content || null, undefined, selectedNoteItem.status)}
                    disabled={isDeletingItem}
                    style={{ padding: '9px 16px', background: 'rgba(200,50,50,.08)', color: '#c03030', border: '1.5px solid rgba(200,50,50,.3)', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '11px', cursor: isDeletingItem ? 'wait' : 'pointer', opacity: isDeletingItem ? 0.6 : 1 }}
                  >{isDeletingItem ? '⏳' : '🗑️'} Delete</button>
                </div>
              </>
            )})()}
          </div>
        </div>
      )}

      {/* Resource Preview Popup */}
      {selectedResourceItem && (() => {
        const r = selectedResourceItem;
        const color = r._color || '#8a5a2e';
        const status = r._status;
        const isGenImage = r._kind === 'GENERATION' && r._isImageUrl && r._url;
        const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : '';
        return (
          <div
            onClick={() => { setSelectedResourceItem(null); setIsEditingGeneration(false); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(20,12,4,.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 'clamp(12px,4vw,40px)',
              animation: 'fadeIn .18s ease'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 560,
                background: '#FEFAE0',
                borderRadius: '4px',
                boxShadow: '0 24px 60px rgba(0,0,0,.35), 0 0 0 1px rgba(138,90,46,.15)',
                position: 'relative',
                maxHeight: '88vh', overflowY: 'auto',
                animation: 'slideUp .2s ease',
                overflow: 'hidden'
              }}
            >
              {/* Top bar - catalog style */}
              <div style={{ background: '#21282E', padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', letterSpacing: '.15em', color: '#FEFAE0', fontWeight: 700 }}>
                  SAVED RESOURCES · {r._kind}
                </span>
                {r._source && (
                  <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', color: 'rgba(254,250,224,.6)' }}>
                    {r._source}
                  </span>
                )}
              </div>

              {/* Image preview for generations */}
              {(() => {
                 let previewImg = isGenImage ? r._url : null;
                 if (r._kind === 'GENERATION' && typeof r.content === 'string' && r.content.startsWith('{')) {
                   try {
                     const parsed = JSON.parse(r.content);
                     if (parsed.previewImageUrl) previewImg = parsed.previewImageUrl;
                     else if (parsed.previewUrl) previewImg = parsed.previewUrl;
                   } catch(e) {}
                 }
                 if (!previewImg) return null;
                 return (
                   <div style={{ width: '100%', maxHeight: '280px', overflow: 'hidden', background: '#e8e4c9', display: 'flex', justifyContent: 'center' }}>
                     <img src={previewImg} alt={r.title || 'Preview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   </div>
                 );
              })()}

              {/* Body content */}
              <div style={{ padding: '24px 26px 28px' }}>
                {/* Type badge + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '4px', background: r._source === 'Student Showcase' ? '#7c5cbf' : color, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r._source === 'Student Showcase' ? 'SS' : r._kind?.slice(0,2)}</span>
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: r._source === 'Student Showcase' ? '#7c5cbf' : color, fontWeight: 700 }}>{r._source === 'Student Showcase' ? '🌟 STUDENT SHOWCASE' : r._kind}</span>
                    {r._typeTag && <span style={{ fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#8a7c66' }}>{r._typeTag}</span>}
                    {r._kind === 'GENERATION' && r._source !== 'Student Showcase' && (() => {
                      try {
                        const contentData = r.content ? JSON.parse(r.content) : {};
                        return contentData.showcaseVisible ? <span style={{ fontFamily: '"DM Mono", monospace', fontSize: '9px', letterSpacing: '.14em', background: '#7c5cbf', color: '#fff', padding: '3px 8px', borderRadius: '20px' }}>🌟 SHOWCASE APPROVED</span> : null;
                      } catch (e) { return null; }
                    })()}
                  </div>
                  {dateStr && (
                    <span style={{ fontFamily: '"Courier New", monospace', fontSize: '9px', color: '#7A2E2E', border: '1.5px solid #7A2E2E', padding: '4px 8px', borderRadius: '3px', letterSpacing: '.06em', transform: 'rotate(-2deg)', opacity: 0.8 }}>
                      {status === 'approved' ? '✓ ' : status === 'pending' ? '⏳ ' : ''}{dateStr}
                    </span>
                  )}
                </div>

                {/* Title */}
                {isEditingGeneration && r._kind === 'GENERATION' ? (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '6px' }}>ASSET URL</label>
                    <input
                      value={editGenUrl}
                      onChange={e => { setEditGenUrl(e.target.value); setEditGenTitle(e.target.value); }}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', color: '#4a3822', border: '1.5px solid rgba(138,90,46,.3)', borderRadius: '8px', background: '#fff', marginBottom: '12px', fontFamily: '"DM Mono", monospace', wordBreak: 'break-all' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateGeneration(r.id)} style={{ padding: '10px 18px', background: '#2E5534', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setIsEditingGeneration(false)} style={{ padding: '10px 18px', background: 'transparent', color: '#5c4f3c', border: '1.5px solid rgba(138,90,46,.25)', borderRadius: '8px', fontFamily: '"DM Mono", monospace', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <h2 style={{ fontWeight: 800, color: '#21282E', fontSize: 'clamp(14px,2.5vw,20px)', lineHeight: 1.3, margin: '0 0 12px', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                    {r.title}
                  </h2>
                )}

                {/* Category / shelf */}
                {r.category?.label && (
                  <div style={{ fontSize: '14px', color: '#5c4f3c', marginBottom: '8px' }}>
                    Shelf — {r.category.label}
                  </div>
                )}

                {/* Content / Description */}
                {(r.content || r.description || r.note || r.body) && (
                  <>
                    {(() => {
                       let displayContent = r.content || r.description || r.note || (typeof r.body === 'string' && r.body.replace(/<[^>]+>/g, '').trim()) || '';
                       
                       if (typeof displayContent === 'string' && displayContent.startsWith('{') && displayContent.endsWith('}')) {
                         try {
                           const parsed = JSON.parse(displayContent);
                           if (parsed.text) {
                             displayContent = parsed.text;
                           } else {
                             displayContent = ''; // Hide metadata payloads
                           }
                         } catch(e) {}
                       }
                       
                       if (!displayContent) return null;
                       
                       return (
                         <>
                           <div style={{ height: '1px', background: 'rgba(138,90,46,.15)', margin: '14px 0' }} />
                           <div style={{ fontSize: '15px', color: '#3a2412', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                             {displayContent}
                           </div>
                         </>
                       );
                    })()}
                  </>
                )}

                {/* Source */}
                {r._source && (
                  <>
                    <div style={{ height: '1px', background: 'rgba(138,90,46,.15)', margin: '14px 0' }} />
                    <div style={{ fontSize: '13px', color: '#7a5a3a', fontFamily: '"Courier New", monospace' }}>
                      Source — {r._source}
                    </div>
                  </>
                )}

                {/* Admin review note */}
                {r.reviewNote && (
                  <div style={{ padding: '12px 14px', background: 'rgba(138,90,46,.05)', border: '1.5px solid rgba(138,90,46,.15)', borderRadius: '6px', marginTop: '16px' }}>
                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: '9px', letterSpacing: '.12em', color: '#7a5a3a', marginBottom: '5px', fontWeight: 700 }}>ADMIN NOTE</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#3a2412' }}>{r.reviewNote}</div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
                  {r._kind === 'WORKFORCE' && r._url && (
                    <button
                      onClick={() => window.open(r._url, '_blank')}
                      style={{
                        padding: '12px 22px',
                        background: '#2E5534', color: '#fff', border: 'none',
                        borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                        fontSize: '14px', fontWeight: 700,
                        cursor: 'pointer', 
                        transition: 'opacity .15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      Open Link ↗
                    </button>
                  )}
                  {r._kind === 'WORKFORCE' && r._vaultUrl && (
                    <button
                      onClick={() => window.location.href = r._vaultUrl}
                      style={{
                        padding: '12px 22px',
                        background: 'rgba(46,85,52,.12)', color: '#2E5534', border: '1.5px solid rgba(46,85,52,.3)',
                        borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                        fontSize: '14px', fontWeight: 700,
                        cursor: 'pointer', 
                        transition: 'background .15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(46,85,52,.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(46,85,52,.12)')}
                    >
                      Open Resources →
                    </button>
                  )}
                  {r._kind !== 'WORKFORCE' && r._url && (
                    <button
                      onClick={() => {
                        if (r._isUnavailable) return;
                        const safeTitle = r.title ? encodeURIComponent(r.title.replace(' [UNAVAILABLE]', '')) : '';
                        if (r._kind === 'CONTRIBUTOR' && r._cohortId) {
                          window.open(`/hub/pilot-workshops/${r._cohortId}/journey?tab=showcase&itemTitle=${safeTitle}`, '_blank');
                        } else if (r._kind === 'STUDENT SHOWCASE' && r._cohortId) {
                          window.open(`/hub/pilot-workshops/${r._cohortId}/journey?tab=studentshowcase&itemTitle=${safeTitle}`, '_blank');
                        } else {
                          window.open(r._url, '_blank');
                        }
                      }}
                      disabled={r._isUnavailable}
                      style={{
                        padding: '12px 22px',
                        background: r._isUnavailable ? '#999' : '#2E5534', 
                        color: '#fff', border: 'none',
                        borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                        fontSize: '14px', fontWeight: 700,
                        cursor: r._isUnavailable ? 'not-allowed' : 'pointer', 
                        transition: 'opacity .15s'
                      }}
                      onMouseEnter={e => { if (!r._isUnavailable) e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={e => { if (!r._isUnavailable) e.currentTarget.style.opacity = '1' }}
                    >
                      {r._isUnavailable ? 'Resource Unavailable' : (r._viewLabel || 'Open Resource ↗')}
                    </button>
                  )}
                  {r._kind === 'GENERATION' && (
                    <button
                      onClick={() => { setEditGenTitle(r.title); setEditGenUrl(r._url || r.url || ''); setIsEditingGeneration(true); }}
                      style={{
                        padding: '12px 22px',
                        background: 'rgba(162,117,50,.1)', color: '#8a5a2e',
                        border: '1.5px solid rgba(162,117,50,.3)',
                        borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                        fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {r._kind === 'GENERATION' && (
                    <button
                      onClick={() => confirmDeleteEngagement(r.id, 'generation', r.title, false, r.source || r._source || '', r.content || null, undefined, r._status || r.status)}
                      disabled={isDeletingItem}
                      style={{
                        padding: '12px 22px',
                        background: 'rgba(200,50,50,.08)', color: '#c03030',
                        border: '1.5px solid rgba(200,50,50,.3)',
                        borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                        fontSize: '14px', fontWeight: 600,
                        cursor: isDeletingItem ? 'wait' : 'pointer',
                        opacity: isDeletingItem ? 0.6 : 1
                      }}
                    >
                      {isDeletingItem ? '⏳' : '🗑️'} Delete
                    </button>
                  )}
                  {(r._kind === 'LIBRARY' || r._kind === 'WORKFORCE' || r._kind === 'JOB' || r._kind === 'ENVIRONMENTAL' || r._kind === 'BOOKMARK' || r._kind === 'SHOWCASE' || r._kind === 'WORKSHOP' || r._kind === 'CONTRIBUTOR' || r._kind === 'STUDENT SHOWCASE') && r.id && (
                    <button
                      onClick={() => confirmDeleteEngagement(r.engagementId || r.id, ['WORKSHOP', 'CONTRIBUTOR', 'STUDENT SHOWCASE'].includes(r._kind) ? 'bookmark' : 'note', r.title, ['LIBRARY', 'WORKFORCE', 'JOB', 'ENVIRONMENTAL', 'BOOKMARK'].includes(r._kind), r.source || r._source || '', r.content || null, undefined, r._status || r.status)}
                      disabled={isDeletingItem}
                      style={{
                        padding: '12px 22px',
                        background: 'rgba(200,50,50,.08)', color: '#c03030',
                        border: '1.5px solid rgba(200,50,50,.3)',
                        borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                        fontSize: '14px', fontWeight: 600,
                        cursor: isDeletingItem ? 'wait' : 'pointer',
                        opacity: isDeletingItem ? 0.6 : 1
                      }}
                    >
                      {isDeletingItem ? '⏳' : '☆'} Unbookmark
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedResourceItem(null); setIsEditingGeneration(false); }}
                    style={{
                      padding: '12px 22px',
                      background: 'transparent', color: '#5c4f3c',
                      border: '1.5px solid rgba(138,90,46,.25)',
                      borderRadius: '8px', fontFamily: '"Exo", sans-serif',
                      fontSize: '14px', fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background .15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(138,90,46,.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Popup for Deletion/Unbookmarking */}
      {itemToDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 11000,
            background: 'rgba(20,12,4,.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(12px,4vw,40px)',
            animation: 'fadeIn .18s ease'
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 400,
              background: '#FEFAE0',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,.35), 0 0 0 1px rgba(138,90,46,.15)',
              animation: 'slideUp .2s ease',
              textAlign: 'center'
            }}
          >
            <h3 style={{ margin: '0 0 16px', color: '#21282E', fontSize: '18px', fontWeight: 700 }}>
              {itemToDelete.isBookmark ? 'Unbookmark Resource?' : 'Delete Item?'}
            </h3>
            <p style={{ margin: '0 0 24px', color: '#5c4f3c', fontSize: '15px', lineHeight: 1.5 }}>
              This will reduce your engagement percentage by <strong>{itemToDelete.percentage}%</strong> for removing &quot;<strong>{itemToDelete.title}</strong>&quot; from your profile.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeletingItem}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#5c4f3c',
                  border: '1.5px solid rgba(138,90,46,.25)',
                  borderRadius: '8px',
                  fontFamily: '"Exo", sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteEngagement}
                disabled={isDeletingItem}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(200,50,50,.08)',
                  color: '#c03030',
                  border: '1.5px solid rgba(200,50,50,.3)',
                  borderRadius: '8px',
                  fontFamily: '"Exo", sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isDeletingItem ? 'wait' : 'pointer',
                  opacity: isDeletingItem ? 0.6 : 1
                }}
              >
                {isDeletingItem ? '⏳' : (itemToDelete.isBookmark ? 'Unbookmark' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Certificate Preview Modal - Matching VictoryScreen design */}
      {showCertPreview && (
        <div 
          onClick={() => setShowCertPreview(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,4,16,.92)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(12px,3vw,40px)', overflow: 'auto' }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ width: '100%', maxWidth: 760, maxHeight: '94vh', overflow: 'auto', background: '#f7f1e0', border: '3px solid #b58a2e', borderRadius: 5, boxShadow: '0 0 0 9px #f8f0da, 0 0 0 11px #c9a24a, 0 30px 70px rgba(0,0,0,.6)', position: 'relative', color: '#3a2c14', fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <button 
              onClick={() => setShowCertPreview(false)} 
              title="Close certificate" 
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: '#8a6a2a', background: 'rgba(0,0,0,.05)', border: '2px solid #c9a24a', borderRadius: 4, padding: '7px 9px', cursor: 'pointer', zIndex: 3, fontFamily: '"DM Mono", monospace', letterSpacing: 1 }}
            >
              ✕
            </button>
            <div style={{ padding: 'clamp(26px,4.5vw,48px) clamp(22px,4.5vw,56px)', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: 8, letterSpacing: 3, color: '#a07d2c', fontFamily: '"DM Mono", monospace' }}>✦ {certSettings.certOrg.toUpperCase()} ✦</div>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', letterSpacing: 5, color: '#8a6a2a', marginTop: 9, textTransform: 'uppercase' }}>Pilot Workshops · The Steward's Journey</div>
              <div style={{ height: 2, width: 130, background: '#c9a24a', margin: '18px auto' }}></div>
              <div style={{ fontSize: 'clamp(25px,4.8vw,42px)', fontWeight: 700, letterSpacing: 2, color: '#241a08' }}>Certificate of Completion</div>
              <div style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#5a4626', marginTop: 22, fontStyle: 'italic' }}>This certifies that</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, margin: '12px 0 6px', flexWrap: 'wrap' }}>
                {workshopCharacter && (
                  <PixelSprite 
                    characterKey={workshopCharacter.character_key} 
                    accent={workshopCharacter.accent_color || '#ffd23f'} 
                    size={48} 
                    opts={{ gear: workshopCharacter.gear || 'none', outfit: workshopCharacter.outfit || 'plain' }} 
                  />
                )}
                <div style={{ fontSize: 'clamp(23px,4.2vw,36px)', fontWeight: 700, color: '#1a1206', borderBottom: '2px solid #c9a24a', padding: '0 18px 6px' }}>
                  {profile?.full_name || user?.fullName || 'Steward'}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#8a6a2a', letterSpacing: 2, marginBottom: 22, textTransform: 'uppercase' }}>Steward · Certified Steward</div>
              
              <div style={{ fontSize: 'clamp(15px,1.9vw,17px)', lineHeight: 1.75, color: '#3a2c14', maxWidth: 580, margin: '0 auto' }}>
                {certSettings.certMessage || 'has journeyed the full three-day intensive of The Steward\'s Journey, practicing Active Production over Passive Consumption and banking three original deliverables into the StewardWorks portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of 12 Steward Principles carried forward — this steward is hereby conferred the standing of Certified Steward.'}
              </div>

              {/* Deliverables of Record */}
              <div style={{ borderTop: '2px solid #dcc890', borderBottom: '2px solid #dcc890', margin: '26px auto', padding: '18px 0', maxWidth: 580, textAlign: 'left' }}>
                <div style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, textAlign: 'center', marginBottom: 15, fontFamily: '"DM Mono", monospace' }}>◆ DELIVERABLES OF RECORD ◆</div>
                {certWorkshopDays && certWorkshopDays.length > 0 ? (
                  certWorkshopDays.slice(0, 3).map((day: any, idx: number) => {
                    const progress = certProgressRows?.find((p: any) => p.workshop_day_id === day.id);
                    return (
                      <div key={day.id} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 11 }}>
                        <div style={{ flex: 'none', fontWeight: 700, color: '#8a6a2a', minWidth: 52 }}>D{idx + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, color: '#241a08', fontWeight: 700 }}>{day.deliverable_title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`}</div>
                          {progress?.deliverable_url && <div style={{ fontSize: 13, color: '#6a542c', wordBreak: 'break-all', fontFamily: "'Courier New',monospace" }}>{progress.deliverable_url}</div>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Fallback: show default deliverable names if days data is not available
                  [1, 2, 3].map((num) => (
                    <div key={num} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 11 }}>
                      <div style={{ flex: 'none', fontWeight: 700, color: '#8a6a2a', minWidth: 52 }}>D{num}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, color: '#241a08', fontWeight: 700 }}>DAY {num} DELIVERABLE</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Signatures Section */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 580, margin: '30px auto 0' }}>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSettings.certFacilitator}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>{certSettings.certFacTitle} · {certSettings.certOrg}</div>
                </div>
                <div style={{ flex: 'none', textAlign: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle at 38% 30%,#f6dd8c 0%,#e6bd54 46%,#c69528 78%,#9c7015 100%)', border: '3px solid #8a6a2a', boxShadow: '0 3px 10px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.4),inset 0 -6px 14px rgba(120,84,18,.5)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <img src="/images/cert/steward-seal.png" alt="Seal" style={{ width: '85%', height: '85%', objectFit: 'contain', opacity: 0.9 }} />
                  </div>
                  <div style={{ fontSize: 6, color: '#8a6a2a', marginTop: 7, letterSpacing: 2, fontFamily: '"DM Mono", monospace' }}>OFFICIAL SEAL</div>
                </div>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{profile?.full_name || user?.fullName || 'Steward'}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626' }}>THE STEWARD</div>
                </div>
              </div>

              {/* Fiscal Sponsor */}
              <div style={{ maxWidth: 300, margin: '24px auto 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSettings.certSponsor}</div>
                <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>FISCAL SPONSOR · {certSettings.certSponsorOrg}</div>
              </div>

              {/* Issue Info */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', maxWidth: 580, margin: '26px auto 0', fontSize: 11, color: '#8a6a2a', letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>
                <div>ISSUED {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
                <div>CERTIFICATE NO. SW-{workshopCharacter?.character_key?.toUpperCase() || 'PW'}-{Date.now().toString().slice(-4)}</div>
              </div>

              {/* Funding Logos */}
              <div style={{ borderTop: '1px solid rgba(138,106,42,.3)', margin: '24px auto 0', paddingTop: 20, paddingBottom: 0, maxWidth: 580, textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, marginBottom: 12, fontFamily: '"DM Mono", monospace' }}>WITH FUNDING FROM JOBS FIRST THROUGH SDSU</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, marginBottom: 0 }}>
                  <img src="/images/cert/logo-ca-jobs-first.png" alt="CA Jobs First" style={{ height: 38, objectFit: 'contain' }} />
                  <img src="/images/cert/logo-sdsu-rf.png" alt="SDSU Research Foundation" style={{ height: 38, objectFit: 'contain' }} />
                  <img src="/images/cert/logo-becoming.webp" alt="The Becoming Project" style={{ height: 38, objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Note Modal */}
      {isAddingNote && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAddingNote(false)}>
          <div style={{ background: '#FEFAE0', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '2px solid rgba(33,40,46,.12)', position: 'sticky', top: 0, background: '#FEFAE0', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: '"DM Mono", monospace', fontSize: '16px', letterSpacing: '.1em', color: '#3a2412', margin: 0 }}>ADD NEW NOTE / PROMPT / MINI DELIVERABLE</h2>
                <button onClick={() => setIsAddingNote(false)} style={{ background: 'none', border: 'none', color: '#7a5a3a', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              </div>
              <p style={{ fontSize: '13px', color: '#7a5a3a', marginTop: '8px', marginBottom: 0 }}>Your submission will be reviewed by an admin before appearing in your profile.</p>
            </div>
            
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button 
                  onClick={() => setNoteType('note')}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: noteType === 'note' ? '2px solid #3f5460' : '2px solid rgba(33,40,46,.15)', background: noteType === 'note' ? 'rgba(63,84,96,.1)' : '#fff', color: '#3a2412', fontWeight: noteType === 'note' ? 700 : 400, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '13px' }}
                >
                  📝 NOTE
                </button>
                <button 
                  onClick={() => setNoteType('prompt')}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: noteType === 'prompt' ? '2px solid #DB9B2F' : '2px solid rgba(33,40,46,.15)', background: noteType === 'prompt' ? 'rgba(219,155,47,.1)' : '#fff', color: '#3a2412', fontWeight: noteType === 'prompt' ? 700 : 400, cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: '13px' }}
                >
                  ⌘ PROMPT
                </button>
              </div>

              {/* Mini Deliverable Banner/Checkbox */}
              <div style={{ marginBottom: '20px', background: isMiniDeliverable ? 'rgba(219,155,47,.15)' : '#fff', border: isMiniDeliverable ? '2px solid #DB9B2F' : '2px solid rgba(33,40,46,.15)', borderRadius: '8px', padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all .2s' }} onClick={() => setIsMiniDeliverable(!isMiniDeliverable)}>
                <input type="checkbox" checked={isMiniDeliverable} onChange={() => {}} style={{ width: 18, height: 18, accentColor: '#DB9B2F', cursor: 'pointer' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#3a2412', fontSize: '14px' }}>Mark as Mini Deliverable</div>
                  {isMiniDeliverable && <div style={{ fontSize: '12px', color: '#8a5a2e', marginTop: 4 }}>🏆 This will be submitted as a Mini Deliverable. You'll earn +4% engagement after admin approval.</div>}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '8px' }}>TITLE *</label>
                <input 
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter a title..."
                  style={{ width: '100%', padding: '12px 14px', background: '#fff', border: '2px solid rgba(33,40,46,.15)', borderRadius: '8px', fontSize: '15px', color: '#3a2412', outline: 'none' }}
                  autoFocus
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: '"DM Mono", monospace', fontSize: '11px', letterSpacing: '.1em', color: '#8a5a2e', marginBottom: '8px' }}>CONTENT *</label>
                <div style={{ border: '2px solid rgba(33,40,46,.15)', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                  <RichTextEditor 
                    content={noteHtmlContent}
                    onChange={(html) => {
                      setNoteHtmlContent(html);
                      setNoteContent(html.replace(/<[^>]+>/g, ''));
                    }}
                    onUpload={async (formData) => {
                      const res = await uploadNoteImage(formData);
                      return { publicUrl: res, type: 'image' };
                    }}
                  />
                </div>
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
                  disabled={isSaving || !noteTitle.trim() || (!noteHtmlContent.trim() && !noteContent.trim())}
                  style={{ background: isSaving || !noteTitle.trim() || (!noteHtmlContent.trim() && !noteContent.trim()) ? '#ccb89a' : '#3f5460', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, color: '#FEFAE0', cursor: isSaving || !noteTitle.trim() || (!noteHtmlContent.trim() && !noteContent.trim()) ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? 'Saving...' : (isMiniDeliverable ? 'Submit Mini Deliverable' : `Save ${noteType === 'prompt' ? 'Prompt' : 'Note'}`)}
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

