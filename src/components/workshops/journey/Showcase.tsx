'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import type { WorkshopShowcase, WorkshopEngagement } from '@/types/workshops'
import { getAllGenerations, addEngagement, uploadCreationImage } from '@/app/actions/workshops/engagement'
import { getStudentShowcaseDeliverables } from '@/app/actions/workshops/showcase'
import { getShowcaseSettings, updateShowcaseSettings } from '@/app/actions/workshops/showcase_settings'
import { isImageUrl } from '@/components/workshops/DeliverableMediaPreview'
import toast from 'react-hot-toast'

/* ── local item shape ── */
interface ShowcaseItem {
  id: string
  type: 'video' | 'article' | 'audio' | 'aigen' | 'image'
  title: string
  author: string
  meta: string
  paid: boolean
  blurb: string
  theme: string
  thumb: string
  url?: string
  contentItemId?: string
  previewUrl?: string | null
  projectType?: string | null
}

/* ── type→color mapping ── */
const TYPE_COLOR: Record<string, string> = {
  video: '#45d6ff',
  image: '#C8643F',
  article: '#ffd23f',
  audio: '#ff5fd2',
  aigen: '#74f0a0',
}

const TYPE_LABEL: Record<string, string> = {
  video: '▶ VIDEO',
  image: '📷 IMAGE',
  article: '✎ ARTICLE',
  audio: '♫ AUDIO',
  aigen: '✦ AI GEN',
}

/* ── project type mapping ── */
const PROJECT_TYPE_LABELS: Record<string, string> = {
  'A': 'Creative Projects Made with AI',
  'B': 'AI in the Workplace & Freelancing',
  'C': 'Nature, Local Landscapes & Resource Use',
  'D': 'Digital Sovereignty, Rules & Ethics',
  'E': 'Digital Wellness & Human Connection',
  'creative_ai': 'Creative Projects Made with AI',
  'workplace_freelance': 'AI in the Workplace & Freelancing',
  'nature_resource': 'Nature, Local Landscapes & Resource Use',
  'digital_sovereignty': 'Digital Sovereignty, Rules & Ethics',
  'digital_wellness': 'Digital Wellness & Human Connection',
}

/* ── filter tabs ── */
interface FilterTab {
  key: string
  label: string
  typeFilter: string | null
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'ALL', typeFilter: null },
  { key: 'video', label: 'VIDEO', typeFilter: 'video' },
  { key: 'image', label: 'IMAGES', typeFilter: 'image' },
  { key: 'article', label: 'ARTICLES', typeFilter: 'article' },
  { key: 'audio', label: 'AUDIO', typeFilter: 'audio' },
  { key: 'aigen', label: 'AI GENERATIONS', typeFilter: 'aigen' },
]

/* ── props ── */
interface ShowcaseProps {
  showcaseItems?: WorkshopShowcase[]
  engagements?: WorkshopEngagement[]
  onBookmark?: (key: string, title: string, source: string, url?: string, content?: string) => Promise<void> | void
  cohortId?: string
  onlyStudents?: boolean
  onlyContributors?: boolean
  isAdmin?: boolean
}

/* ═══════════════════════════════════════════════════════════════
   Showcase Component
   ═══════════════════════════════════════════════════════════════ */
export default function Showcase({ showcaseItems = [], engagements = [], onBookmark, cohortId, onlyStudents = false, onlyContributors = false, isAdmin = false }: ShowcaseProps) {
  const [viewModeState, setViewModeState] = useState('contributors' as 'contributors' | 'students')
  const activeViewMode = onlyStudents ? 'students' : onlyContributors ? 'contributors' : viewModeState
  const [filter, setFilter] = useState('all')
  const [preview, setPreview] = useState(null as string | null)
  const [studentDetail, setStudentDetail] = useState(null as any | null)
  
  // Local bookmark state for immediate UI feedback (persists across re-renders)
  const [localBookmarks, setLocalBookmarks] = useState(() => new Set() as Set<string>)
  const localBookmarksRef = useRef(new Set() as Set<string>)
  
  // Student showcase data
  const [studentItems, setStudentItems] = useState([] as any[])
  const [studentsLoading, setStudentsLoading] = useState(false)

  const [settings, setSettings] = useState({
    contributors_title: '★ CONTRIBUTORS SHOWCASE LIBRARY',
    contributors_description: 'Curated lessons, articles, audio guides, and AI-generated packs from community contributors, partner educators, and the StewardWorks AI Lab. Bookmark items to your desk for quick reference during workshops.',
    student_title: '★ STUDENT SHOWCASE LIBRARY',
    student_description: 'Explore inspiring AI creations designed by your peers. When instructors approve student creations, they appear here.',
    tally_link: 'https://tally.so/r/0QyDkQ',
    show_tally_link: false
  })
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [editSettings, setEditSettings] = useState(settings)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    getShowcaseSettings().then(data => {
      if (data) {
        setSettings({
          contributors_title: data.contributors_title || '★ CONTRIBUTORS SHOWCASE LIBRARY',
          contributors_description: data.contributors_description || 'Curated lessons, articles, audio guides, and AI-generated packs from community contributors, partner educators, and the StewardWorks AI Lab. Bookmark items to your desk for quick reference during workshops.',
          student_title: data.student_title || '★ STUDENT SHOWCASE LIBRARY',
          student_description: data.student_description || 'Explore inspiring AI creations designed by your peers. When instructors approve student creations, they appear here.',
          tally_link: data.tally_link || 'https://tally.so/r/0QyDkQ',
          show_tally_link: !!data.show_tally_link
        })
      }
    }).catch(err => console.error('Failed to load settings', err))
  }, [])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateShowcaseSettings(editSettings)
      setSettings(editSettings)
      setShowSettingsForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSettings(false)
    }
  }


  // Add Showcase form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addDescription, setAddDescription] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addFilePreview, setAddFilePreview] = useState<string | null>(null)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const addFileInputRef = useRef<HTMLInputElement>(null)
  // Preview image state (for non-media URLs)
  const [addPreviewFile, setAddPreviewFile] = useState<File | null>(null)
  const [addPreviewFileUrl, setAddPreviewFileUrl] = useState<string | null>(null)
  const previewFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeViewMode === 'students' && cohortId && studentItems.length === 0) {
      setStudentsLoading(true)
      
      Promise.all([
        getAllGenerations(cohortId),
        getStudentShowcaseDeliverables(cohortId)
      ]).then(([engs, delivs]) => {
        const approvedEngs = engs.filter((e: any) => {
          // Only show approved engagements that requested showcase
          if (e.status !== 'approved') return false;
          try {
            const data = JSON.parse(e.content || '{}');
            // If admin explicitly set showcaseVisible to false, hide it
            if (data.showcaseVisible === false) return false;
            // Show if showcaseVisible is true OR if it was requested and approved (legacy items)
            return data.showcaseVisible === true || data.showcaseRequested === true;
          } catch(err) {
            return false;
          }
        });
        
        // delivs already pre-filtered for showcase and structured like engagements
        setStudentItems([...approvedEngs, ...delivs]);
        setStudentsLoading(false);
      }).catch(err => {
        console.error(err);
        setStudentsLoading(false);
      });
    }
  }, [activeViewMode, cohortId, studentItems.length])

  // Handle file selection for showcase upload
  const handleAddFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAddFile(file)
    setAddUrl('') // clear URL if file selected
    // Clear preview image since main file is the media
    setAddPreviewFile(null)
    setAddPreviewFileUrl(null)
    // Generate preview
    const url = URL.createObjectURL(file)
    setAddFilePreview(url)
  }

  // Handle preview image upload (does NOT clear the URL)
  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file for the preview.')
      return
    }
    setAddPreviewFile(file)
    setAddPreviewFileUrl(URL.createObjectURL(file))
  }

  // Detect media type from URL
  const detectMediaType = (url: string) => {
    const lower = url.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i.test(lower)) return 'image'
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(lower) || lower.includes('youtube.com') || lower.includes('youtu.be')) return 'video'
    if (/\.(mp3|wav|ogg|aac|flac)(\?|#|$)/i.test(lower)) return 'audio'
    return 'link'
  }

  // Submit showcase item
  const handleAddShowcaseSubmit = async () => {
    if (!addTitle.trim() || !cohortId) return
    if (!addUrl && !addFile) return
    setAddSubmitting(true)
    try {
      let finalUrl = addUrl
      // Upload file if provided (full media upload replaces URL)
      if (addFile) {
        const formData = new FormData()
        formData.append('file', addFile)
        const uploadedUrl = await uploadCreationImage(formData)
        finalUrl = uploadedUrl
      }

      // Upload preview image if provided (for non-media URLs)
      let previewUrl: string | null = null
      if (addPreviewFile) {
        const previewFormData = new FormData()
        previewFormData.append('file', addPreviewFile)
        previewUrl = await uploadCreationImage(previewFormData)
      }

      // Auto-detect type from URL
      const detectedType = addFile
        ? (addFile.type.startsWith('image') ? 'image' : addFile.type.startsWith('video') ? 'video' : addFile.type.startsWith('audio') ? 'audio' : 'aigen')
        : detectMediaType(finalUrl)

      // Submit as engagement with showcaseRequested flag + preview + detected type
      const contentData: Record<string, any> = {
        showcaseRequested: true,
        description: addDescription,
        detectedType,
      }
      if (previewUrl) {
        contentData.previewUrl = previewUrl
      }
      const content = JSON.stringify(contentData)
      await addEngagement(cohortId, 'generation', addTitle, 'Student Showcase', finalUrl, content)
      // Reset form
      setAddTitle('')
      setAddDescription('')
      setAddUrl('')
      setAddFile(null)
      setAddFilePreview(null)
      setAddPreviewFile(null)
      setAddPreviewFileUrl(null)
      setShowAddForm(false)
      // Force reload student items
      setStudentItems([])
    } catch (err) {
      console.error('Failed to submit showcase:', err)
    } finally {
      setAddSubmitting(false)
    }
  }

  const allItems = useMemo(() => {
    const dbItems: ShowcaseItem[] = showcaseItems.map(s => {
      // Auto-detect correct type from URL when possible
      let detectedType = s.type as any;
      const url = (s.url || '').toLowerCase();
      if (url) {
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$|\/)/i.test(url) || 
                        url.includes('/content-uploads/') || url.includes('/uploads/') ||
                        url.includes('placehold') || url.includes('placeholder') ||
                        url.match(/\/(jpg|jpeg|png|gif|webp)$/i) ||
                        (url.includes('supabase') && url.includes('/storage/') && !url.match(/\.(mp4|webm|mov|mp3|wav|ogg|pdf)/i));
        const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || 
                        /\.(mp4|webm|mov|avi)(\?|#|$|\/)/i.test(url);
        const isAudio = /\.(mp3|wav|ogg|m4a|flac|aac)(\?|#|$|\/)/i.test(url) || 
                        url.includes('soundcloud.com') || url.includes('spotify.com');
        
        // Priority: video > audio > image
        if (isVideo) detectedType = 'video';
        else if (isAudio) detectedType = 'audio';
        else if (isImage) detectedType = 'image';
      }
      
      return {
        id: s.id,
        type: detectedType,
        title: s.title,
        author: s.author || 'Anonymous',
        meta: (() => {
          try {
            const d = JSON.parse(s.meta || '{}');
            if (d && typeof d === 'object' && d.meta !== undefined) return d.meta;
          } catch {}
          return s.meta || (s.is_paid ? 'Paid content' : 'Free content');
        })(),
        paid: s.is_paid,
        blurb: s.blurb || '',
        theme: s.theme || 'Community',
        thumb: '',
        url: s.url,
        contentItemId: (s as any).content_item_id || undefined,
        previewUrl: (() => {
          try {
            const d = JSON.parse(s.meta || '{}');
            if (d && typeof d === 'object' && d.previewUrl) return d.previewUrl;
          } catch {}
          return null;
        })(),
        projectType: s.project_type
      };
    })
    return dbItems
  }, [showcaseItems])

  /* derived */
  const filtered = useMemo(() => {
    const tab = FILTER_TABS.find(t => t.key === filter)
    if (!tab || !tab.typeFilter) return allItems
    return allItems.filter(c => c.type === tab.typeFilter)
  }, [filter, allItems])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: allItems.length }
    allItems.forEach(c => { m[c.type] = (m[c.type] || 0) + 1 })
    return m
  }, [allItems])

  const isBookmarked = (item: ShowcaseItem) =>
    engagements.some(e => e.kind === 'bookmark' && e.title === item.title && e.status !== 'rejected')

  const getBookmarkSource = (item: { title: string }) => {
    const eng = engagements.find(e => e.kind === 'bookmark' && e.title === item.title && e.status !== 'rejected')
    return eng ? eng.source : null;
  }

  const previewItem = useMemo(() =>
    preview ? allItems.find(c => c.id === preview) ?? null : null
  , [preview, allItems])

  /* student derived */
  const processedStudentItems = useMemo(() => {
    return studentItems.map(item => {
      let detectedType = 'aigen'
      let previewUrl: string | null = null
      const url = (item.url || '').toLowerCase();

      // Try to extract detectedType and previewUrl from content JSON
      try {
        const contentData = JSON.parse(item.content || '{}');
        if (contentData.previewUrl) previewUrl = contentData.previewUrl;
        if (contentData.detectedType) detectedType = contentData.detectedType;
      } catch (err) { /* ignore */ }

      // If no detectedType from content, auto-detect from URL
      if (url && detectedType === 'aigen') {
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$|\/)/i.test(url) || url.includes('/content-uploads/') || url.includes('supabase');
        const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || /\.(mp4|webm|mov|avi)(\?|#|$|\/)/i.test(url);
        const isAudio = /\.(mp3|wav|ogg|m4a|flac|aac)(\?|#|$|\/)/i.test(url) || url.includes('soundcloud.com') || url.includes('spotify.com');
        
        if (isVideo) detectedType = 'video';
        else if (isAudio) detectedType = 'audio';
        else if (isImage) detectedType = 'image';
        else if (item.kind !== 'generation') detectedType = 'article';
      }
      // Map 'link' to 'article' for filter tabs
      if (detectedType === 'link') detectedType = 'article';
      return { ...item, type: detectedType, previewUrl };
    })
  }, [studentItems])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const itemTitle = searchParams.get('itemTitle');
      if (itemTitle) {
        if (activeViewMode === 'contributors' && allItems.length > 0) {
          const item = allItems.find(i => i.title === itemTitle);
          if (item && !preview) {
            setPreview(item.id);
            // Optional: Clean up URL so refresh doesn't pop it up again
            const url = new URL(window.location.href);
            url.searchParams.delete('itemTitle');
            window.history.replaceState({}, '', url);
          }
        } else if (activeViewMode === 'students' && processedStudentItems.length > 0) {
          const item = processedStudentItems.find(i => i.title === itemTitle);
          if (item && !studentDetail) {
            setStudentDetail(item);
            const url = new URL(window.location.href);
            url.searchParams.delete('itemTitle');
            window.history.replaceState({}, '', url);
          }
        }
      }
    }
  }, [activeViewMode, allItems, processedStudentItems, preview, studentDetail]);

  const filteredStudentItems = useMemo(() => {
    const tab = FILTER_TABS.find(t => t.key === filter)
    if (!tab || !tab.typeFilter) return processedStudentItems
    return processedStudentItems.filter(c => c.type === tab.typeFilter)
  }, [filter, processedStudentItems])

  const studentCounts = useMemo(() => {
    const m: Record<string, number> = { all: processedStudentItems.length }
    processedStudentItems.forEach(c => { m[c.type] = (m[c.type] || 0) + 1 })
    return m
  }, [processedStudentItems])

  /* ── render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      {/* Master Toggle */}
      {!onlyStudents && !onlyContributors && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <button
            onClick={() => setViewModeState('contributors')}
            className="font-pixel"
            style={{
              padding: '10px 16px', fontSize: 16, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${activeViewMode === 'contributors' ? 'var(--gold,#ffd23f)' : 'var(--ln,#3d2668)'}`,
              background: activeViewMode === 'contributors' ? 'rgba(255,210,63,.1)' : 'transparent',
              color: activeViewMode === 'contributors' ? 'var(--gold,#ffd23f)' : 'var(--mu,#a493c9)'
            }}
          >
            CONTRIBUTORS
          </button>
          <button
            onClick={() => setViewModeState('students')}
            className="font-pixel"
            style={{
              padding: '10px 16px', fontSize: 16, fontWeight: 'bold', borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${activeViewMode === 'students' ? '#ff5fd2' : 'var(--ln,#3d2668)'}`,
              background: activeViewMode === 'students' ? 'rgba(255,95,210,.1)' : 'transparent',
              color: activeViewMode === 'students' ? '#ff5fd2' : 'var(--mu,#a493c9)'
            }}
          >
            STUDENTS
          </button>
        </div>
      )}

      {activeViewMode === 'contributors' && !onlyStudents && (
        <>
          {/* ═══ Header Banner ═══ */}
          <div style={{
        border: '2px solid var(--gold,#ffd23f)',
        borderRadius: 12,
        padding: 'clamp(14px,2.2vw,22px)',
        background: 'linear-gradient(180deg,rgba(255,210,63,.07),rgba(255,210,63,.02))',
        boxShadow: '0 0 24px rgba(255,210,63,.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 className="font-pixel" style={{
                fontSize: 'clamp(11px,1.6vw,15px)',
                color: 'var(--gold,#ffd23f)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                {settings.contributors_title}
              </h2>
              <p style={{
                fontSize: 16,
                color: 'var(--mu,#a493c9)',
                margin: '8px 0 0',
                lineHeight: 1.55,
              }}>
                {settings.contributors_description}
              </p>
              
              {settings.show_tally_link && settings.tally_link && (
                <div style={{ marginTop: 16 }}>
                  <a
                    href={settings.tally_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-pixel"
                    style={{ display: 'inline-block', fontSize: 10, padding: '10px 16px', background: 'var(--gold,#ffd23f)', color: '#0e1512', border: 'none', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px', textDecoration: 'none' }}
                  >
                    + BECOME A CONTRIBUTOR
                  </a>
                </div>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => { setEditSettings(settings); setShowSettingsForm(true); }}
                className="font-pixel"
                style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: 'transparent', color: 'var(--gold,#ffd23f)', border: '2px solid var(--gold,#ffd23f)', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px' }}
              >
                ✎ EDIT
              </button>
            )}
          </div>
        </div>

      {/* ═══ Filter Tabs ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '18px 0' }}>
        {FILTER_TABS.map(tab => {
          const active = filter === tab.key
          const count = tab.typeFilter ? (counts[tab.typeFilter] || 0) : counts.all
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="font-pixel"
              style={{
                fontSize: 9,
                fontWeight: 'normal',
                padding: '8px 12px',
                borderRadius: 6,
                border: `2px solid var(--s,#45d6ff)`,
                background: active ? 'var(--s,#45d6ff)' : 'transparent',
                color: active ? '#12081e' : 'var(--s,#45d6ff)',
                cursor: 'pointer',
                transition: 'all .15s',
                letterSpacing: '.5px',
              }}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ═══ Card Grid ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
        gap: 14,
      }}>
        {filtered.map(item => (
          <ContributionCard
            key={item.id}
            item={item}
            bookmarked={isBookmarked(item)}
            bookmarkSource={getBookmarkSource(item)}
            onOpen={() => setPreview(item.id)}
            onBookmark={() => onBookmark && onBookmark('contrib-' + item.id, item.title, 'Showcase · ' + item.theme, item.url || undefined, item.previewUrl ? JSON.stringify({ previewUrl: item.previewUrl }) : undefined)}
          />
        ))}
      </div>
      </>
      )}

      {activeViewMode === 'students' && !onlyContributors && (
        <>
          {/* ═══ Header Banner ═══ */}
          <div style={{
            border: '2px solid #ff5fd2',
            borderRadius: 12,
            padding: 'clamp(14px,2.2vw,22px)',
            background: 'linear-gradient(180deg,rgba(255,95,210,.07),rgba(255,95,210,.02))',
            boxShadow: '0 0 24px rgba(255,95,210,.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h2 className="font-pixel" style={{
                  fontSize: 'clamp(12px,1.8vw,18px)',
                  color: '#ff5fd2',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {settings.student_title}
                </h2>
                <p style={{
                  fontSize: 18,
                  color: 'var(--mu,#a493c9)',
                  margin: '8px 0 0',
                  lineHeight: 1.55,
                }}>
                  {settings.student_description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {isAdmin && (
                  <button
                    onClick={() => { setEditSettings(settings); setShowSettingsForm(true); }}
                    className="font-pixel"
                    style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: 'transparent', color: '#ff5fd2', border: '2px solid #ff5fd2', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px' }}
                  >
                    ✎ EDIT
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="font-pixel"
                  style={{ flex: 'none', fontSize: 9, padding: '10px 16px', background: '#ff5fd2', color: '#0e1512', border: 'none', borderRadius: 8, cursor: 'pointer', letterSpacing: '.5px', whiteSpace: 'nowrap' }}
                >
                  + ADD SHOWCASE
                </button>
              </div>
            </div>
          </div>

          {/* ═══ Filter Tabs ═══ */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '18px 0' }}>
            {FILTER_TABS.map(tab => {
              const active = filter === tab.key
              const count = tab.typeFilter ? (studentCounts[tab.typeFilter] || 0) : studentCounts.all
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className="font-pixel"
                  style={{
                    fontSize: 9,
                    fontWeight: 'normal',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `2px solid #ff5fd2`,
                    background: active ? '#ff5fd2' : 'transparent',
                    color: active ? '#12081e' : '#ff5fd2',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    letterSpacing: '.5px',
                  }}
                >
                  {tab.label} ({count})
                </button>
              )
            })}
          </div>

          {/* ═══ Add Showcase Modal ═══ */}
          {showAddForm && (
            <div onClick={() => setShowAddForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(6,12,9,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'var(--bg,#12081e)', border: '2px solid #ff5fd2', borderRadius: 14, padding: 'clamp(20px,3vw,32px)', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 className="font-pixel" style={{ fontSize: 12, color: '#ff5fd2', margin: 0 }}>+ ADD TO SHOWCASE</h3>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: '1.5px solid rgba(255,95,210,.3)', borderRadius: '50%', width: 28, height: 28, color: '#ff5fd2', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                {/* Title */}
                <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>TITLE *</label>
                <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="My AI creation title" style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit' }} />

                {/* Description */}
                <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>DESCRIPTION</label>
                <textarea value={addDescription} onChange={e => setAddDescription(e.target.value)} placeholder="Describe your creation..." rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit', resize: 'vertical' }} />

                {/* URL or Upload */}
                <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>MEDIA (URL OR UPLOAD) *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input value={addUrl} onChange={e => { setAddUrl(e.target.value); setAddFile(null); setAddFilePreview(null); setAddPreviewFile(null); setAddPreviewFileUrl(null); }} placeholder="Paste URL (image, video, audio, or any link)" style={{ flex: 1, padding: '10px 12px', fontSize: 13, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', fontFamily: "'DM Mono',monospace" }} />
                  <button onClick={() => addFileInputRef.current?.click()} className="font-pixel" style={{ flex: 'none', fontSize: 8, padding: '10px 14px', background: 'rgba(255,95,210,.15)', color: '#ff5fd2', border: '1.5px solid rgba(255,95,210,.3)', borderRadius: 8, cursor: 'pointer' }}>↑ UPLOAD</button>
                  <input ref={addFileInputRef} type="file" accept="image/*,video/*,audio/*" style={{ display: 'none' }} onChange={handleAddFileChange} />
                </div>

                {/* Media Preview */}
                {(addFilePreview || addUrl) && (() => {
                  const mediaPreviewUrl = addFilePreview || addUrl
                  const type = addFile ? (addFile.type.startsWith('image') ? 'image' : addFile.type.startsWith('video') ? 'video' : addFile.type.startsWith('audio') ? 'audio' : 'link') : detectMediaType(addUrl)
                  return (
                    <div style={{ marginBottom: 16, border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, overflow: 'hidden', background: 'var(--pn,#14211b)' }}>
                      {type === 'image' && <img src={mediaPreviewUrl} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />}
                      {type === 'video' && (
                        addUrl.includes('youtube.com') || addUrl.includes('youtu.be') ? (
                          <img src={`https://img.youtube.com/vi/${addUrl.includes('youtu.be/') ? addUrl.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(addUrl.split('?')[1] || '').get('v')}/mqdefault.jpg`} alt="Video thumbnail" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                        ) : (
                          <video src={mediaPreviewUrl} controls preload="metadata" style={{ width: '100%', maxHeight: 200 }} />
                        )
                      )}
                      {type === 'audio' && <audio src={mediaPreviewUrl} controls style={{ width: '100%', padding: 12 }} />}
                      {type === 'link' && (
                        <>
                          {/* Show uploaded preview image if available, otherwise link icon */}
                          {addPreviewFileUrl ? (
                            <div style={{ position: 'relative' }}>
                              <img src={addPreviewFileUrl} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                              <button
                                onClick={() => { setAddPreviewFile(null); setAddPreviewFileUrl(null); }}
                                style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: '1px solid rgba(255,95,210,.4)', color: '#ff5fd2', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                title="Remove preview image"
                              >×</button>
                            </div>
                          ) : (
                            <div style={{ padding: 12, fontSize: 12, color: 'var(--mu,#a493c9)', fontFamily: "'DM Mono',monospace", wordBreak: 'break-all' }}>🔗 {mediaPreviewUrl}</div>
                          )}
                          {/* Preview image upload button for non-media URLs */}
                          {!addPreviewFileUrl && (
                            <div style={{ padding: '8px 12px', borderTop: '1px dashed var(--ln,#28432f)' }}>
                              <button
                                onClick={() => previewFileInputRef.current?.click()}
                                className="font-pixel"
                                style={{ fontSize: 8, padding: '8px 14px', background: 'rgba(69,214,255,.1)', color: '#45d6ff', border: '1.5px solid rgba(69,214,255,.3)', borderRadius: 6, cursor: 'pointer', letterSpacing: '.5px' }}
                              >
                                📷 + ADD PREVIEW IMAGE
                              </button>
                              <span style={{ fontSize: 10, color: 'var(--mu,#a493c9)', marginLeft: 8, fontFamily: "'DM Mono',monospace" }}>Optional thumbnail</span>
                              <input ref={previewFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePreviewFileChange} />
                            </div>
                          )}
                        </>
                      )}
                      <div style={{ padding: '6px 12px', fontSize: 10, color: '#ff5fd2', fontFamily: "'DM Mono',monospace", borderTop: '1px solid var(--ln,#28432f)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {addFile ? `📎 ${addFile.name}` : addPreviewFile ? `DETECTED: LINK · 📷 Preview: ${addPreviewFile.name}` : `DETECTED: ${type.toUpperCase()}`}
                      </div>
                    </div>
                  )
                })()}

                {/* Submit */}
                <button
                  onClick={handleAddShowcaseSubmit}
                  disabled={addSubmitting || !addTitle.trim() || (!addUrl && !addFile)}
                  className="font-pixel"
                  style={{ width: '100%', fontSize: 10, padding: '14px 20px', background: addSubmitting || !addTitle.trim() || (!addUrl && !addFile) ? '#4a3a5a' : '#ff5fd2', color: '#0e1512', border: 'none', borderRadius: 8, cursor: addSubmitting ? 'wait' : 'pointer', letterSpacing: '.5px', opacity: (!addTitle.trim() || (!addUrl && !addFile)) ? 0.5 : 1 }}
                >
                  {addSubmitting ? '⏳ SUBMITTING...' : '✦ SUBMIT FOR APPROVAL'}
                </button>
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--mu,#a493c9)', textAlign: 'center', lineHeight: 1.4 }}>
                  Your submission will appear here after admin approval.
                </div>
              </div>
            </div>
          )}

          {studentsLoading ? (
            <div className="p-8 text-center font-pixel" style={{ color: '#ff5fd2', marginTop: 40 }}>LOADING SHOWCASE...</div>
          ) : filteredStudentItems.length === 0 ? (
            <div className="p-12 text-center font-pixel" style={{ fontSize: 12, color: '#ff5fd2', border: '2px dashed rgba(255,95,210,0.3)', borderRadius: 12, marginTop: 20 }}>
              The Student Showcase is currently empty for this filter.<br /><br />
              <span style={{ fontSize: 10, color: 'var(--mu,#a493c9)' }}>Generations will appear here when approved by the instructor.</span>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
              gap: 13,
              marginTop: 18
            }}>
              {filteredStudentItems.map(item => {
                const isItemBookmarked = localBookmarks.has(item.title) || localBookmarksRef.current.has(item.title) || engagements.some(e => e.kind === 'bookmark' && e.title === item.title && e.status !== 'rejected');
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setStudentDetail(item)}
                    style={{ 
                      border: '2px solid var(--ln,#28432f)', 
                      borderRadius: 9, 
                      overflow: 'hidden', 
                      background: 'var(--pn,#14211b)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <div 
                      style={{ 
                        height: 120, 
                        background: 'linear-gradient(135deg, rgba(255,95,210,0.2), rgba(255,95,210,0.05))', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {item.url && isImageUrl(item.url) ? (
                        <img 
                          src={item.url} 
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')) ? (
                        <>
                          <img
                            src={`https://img.youtube.com/vi/${item.url.includes('youtu.be/') ? item.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(item.url.split('?')[1] || '').get('v')}/mqdefault.jpg`}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 14, color: '#fff', marginLeft: 2 }}>▶</span>
                            </div>
                          </div>
                        </>
                      ) : item.url && item.url.match(/\.(mp4|webm|mov)/i) ? (
                        <>
                          <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 14, color: '#fff', marginLeft: 2 }}>▶</span>
                            </div>
                          </div>
                        </>
                      ) : item.previewUrl ? (
                        <img 
                          src={item.previewUrl} 
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <span style={{ fontSize: 40, opacity: 0.2, color: '#ff5fd2' }}>✦</span>
                      )}
                    </div>
                    <div style={{ padding: '11px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {/* Left: content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 24, color: 'var(--tx,#d6ffe0)', lineHeight: 1.2, marginBottom: 5 }}>
                          {item.title}
                        </div>
                        
                        <div style={{ fontSize: 18, color: 'var(--mu,#77b78d)', marginTop: 5 }}>
                          by {item.profiles?.full_name || 'Student'}
                        </div>
                      </div>

                      {/* Right: bookmark star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Optimistic local update - both state and ref for persistence
                          const newTitle = item.title;
                          console.log('[DEBUG Showcase] Bookmark clicked:', { id: item.id, title: newTitle, source: item.source, url: item.url });
                          console.log('[DEBUG Showcase] onBookmark exists:', !!onBookmark);
                          localBookmarksRef.current.add(newTitle);
                          setLocalBookmarks(prev => {
                            const next = new Set(prev);
                            next.add(newTitle);
                            return next;
                          });
                          if (onBookmark) {
                            console.log('[DEBUG Showcase] Calling onBookmark with:', 'student-' + item.id, newTitle, item.source || 'Student Showcase', item.url);
                            onBookmark('student-' + item.id, item.title, item.source || 'Student Showcase', item.url || undefined);
                          }
                        }}
                        title={isItemBookmarked ? 'Already bookmarked' : 'Bookmark this creation'}
                        style={{
                          flex: 'none',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: `2px solid ${isItemBookmarked ? '#ffd23f' : 'var(--ln,#3d2668)'}`,
                          background: isItemBookmarked ? '#ffd23f' : 'transparent',
                          color: isItemBookmarked ? '#12081e' : 'var(--mu,#a493c9)',
                          cursor: 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          boxShadow: isItemBookmarked ? '0 0 10px rgba(255,210,63,.5)' : 'none',
                          marginTop: 2,
                          transition: 'all .2s ease',
                        }}
                      >
                        {isItemBookmarked ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Student Detail Popup */}
          {studentDetail && (
            <div 
              onClick={() => setStudentDetail(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 60,
                background: 'rgba(6,12,9,.82)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
              }}
            >
              <div 
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: 440,
                  width: '100%',
                  border: '2px solid #ff5fd2',
                  borderRadius: 12,
                  background: 'var(--pn,#14211b)',
                  boxShadow: '0 24px 60px rgba(0,0,0,.6), 0 0 30px rgba(255,95,210,.25)',
                  animation: 'popin .22s ease',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '16px 18px' }}>
                  {/* Header with close button */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 10, marginBottom: 13 }}>
                    <button 
                      onClick={() => setStudentDetail(null)}
                      title="Close"
                      style={{
                        width: 28,
                        height: 28,
                        flex: 'none',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,.3)',
                        color: 'var(--mu,#77b78d)',
                        fontSize: 16,
                        cursor: 'pointer',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Thumbnail / Media Preview */}
                  <div style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(255,95,210,0.2), rgba(255,95,210,0.05))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--ln,#28432f)',
                    position: 'relative',
                  }}>
                    {studentDetail.url && isImageUrl(studentDetail.url) ? (
                      <img 
                        src={studentDetail.url} 
                        alt={studentDetail.title}
                        style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : studentDetail.url && (studentDetail.url.includes('youtube.com') || studentDetail.url.includes('youtu.be')) ? (
                      <div style={{ width: '100%', aspectRatio: '16/9' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${studentDetail.url.includes('youtu.be/') ? studentDetail.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(studentDetail.url.split('?')[1] || '').get('v')}`}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : studentDetail.url && studentDetail.url.match(/\.(mp4|webm|mov)/i) ? (
                      <video 
                        src={studentDetail.url} 
                        controls 
                        preload="metadata"
                        style={{ width: '100%', maxHeight: 300, display: 'block' }}
                      />
                    ) : studentDetail.url && studentDetail.url.match(/\.(mp3|wav|ogg|aac|flac)/i) ? (
                      <div style={{ width: '100%', padding: 20 }}>
                        <audio src={studentDetail.url} controls style={{ width: '100%' }} />
                      </div>
                    ) : studentDetail.previewUrl ? (
                      <div style={{ width: '100%' }}>
                        <img 
                          src={studentDetail.previewUrl} 
                          alt={studentDetail.title}
                          style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        {studentDetail.url && (
                          <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--mu,#a493c9)', fontFamily: "'DM Mono',monospace", borderTop: '1px solid var(--ln,#28432f)', wordBreak: 'break-all' }}>
                            🔗 {studentDetail.url}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <span style={{ fontSize: 60, opacity: 0.2, color: '#ff5fd2' }}>✦</span>
                      </div>
                    )}
                  </div>

                  {/* Title and author */}
                  <div className="font-pixel" style={{ 
                    fontSize: 12, 
                    color: 'var(--tx,#d6ffe0)', 
                    lineHeight: 1.5, 
                    margin: '15px 0 7px' 
                  }}>
                    {studentDetail.title}
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--mu,#77b78d)' }}>
                    by {studentDetail.profiles?.full_name || 'Student'}
                  </div>

                  {/* In Showcase badge */}
                  <div style={{ marginTop: 9 }}>
                    <span className="font-pixel" style={{ fontSize: 7, color: '#ff5fd2' }}>
                      ★ IN STUDENT SHOWCASE
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 17 }}>
                    {studentDetail.url && (
                      <a 
                        href={studentDetail.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-pixel"
                        style={{
                          fontSize: 8,
                          color: 'var(--bg,#0e1512)',
                          background: 'var(--ng,#4dffa0)',
                          textDecoration: 'none',
                          borderRadius: 5,
                          padding: '11px 14px'
                        }}
                      >
                        ↗ VISIT CREATION
                      </a>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBookmark) {
                          onBookmark('student-' + studentDetail.id, studentDetail.title, studentDetail.source || 'Student Showcase', studentDetail.url || undefined);
                        }
                        setStudentDetail(null);
                      }}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        color: engagements.some(e => e.kind === 'bookmark' && e.title === studentDetail.title) ? '#0e1512' : '#45d6ff',
                        background: engagements.some(e => e.kind === 'bookmark' && e.title === studentDetail.title) ? '#45d6ff' : 'transparent',
                        border: '2px solid #45d6ff',
                        borderRadius: 5,
                        padding: '11px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      {engagements.some(e => e.kind === 'bookmark' && e.title === studentDetail.title) ? '★ BOOKMARKED' : '☆ BOOKMARK'}
                    </button>
                    <button 
                      onClick={() => setStudentDetail(null)}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        color: 'var(--mu,#77b78d)',
                        background: 'none',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 5,
                        padding: '11px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}


      {/* ═══ Settings Edit Modal (Admin Only) ═══ */}
      {showSettingsForm && isAdmin && (
        <div onClick={() => setShowSettingsForm(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(6,12,9,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'var(--bg,#12081e)', border: '2px solid var(--gold,#ffd23f)', borderRadius: 14, padding: 'clamp(20px,3vw,32px)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="font-pixel" style={{ fontSize: 12, color: 'var(--gold,#ffd23f)', margin: 0 }}>⚙ EDIT SHOWCASE HEADERS</h3>
              <button onClick={() => setShowSettingsForm(false)} style={{ background: 'none', border: '1.5px solid rgba(255,210,63,.3)', borderRadius: '50%', width: 28, height: 28, color: 'var(--gold,#ffd23f)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>CONTRIBUTORS TITLE</label>
            <input value={editSettings.contributors_title} onChange={e => setEditSettings(s => ({...s, contributors_title: e.target.value}))} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>CONTRIBUTORS DESCRIPTION</label>
            <textarea value={editSettings.contributors_description} onChange={e => setEditSettings(s => ({...s, contributors_description: e.target.value}))} rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit', resize: 'vertical' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>STUDENT TITLE</label>
            <input value={editSettings.student_title} onChange={e => setEditSettings(s => ({...s, student_title: e.target.value}))} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>STUDENT DESCRIPTION</label>
            <textarea value={editSettings.student_description} onChange={e => setEditSettings(s => ({...s, student_description: e.target.value}))} rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 16, fontFamily: 'inherit', resize: 'vertical' }} />

            <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: '.1em', marginBottom: 6 }}>TALLY FORM LINK</label>
            <input value={editSettings.tally_link} onChange={e => setEditSettings(s => ({...s, tally_link: e.target.value}))} style={{ width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--pn,#14211b)', border: '1.5px solid var(--ln,#28432f)', borderRadius: 8, color: 'var(--tx,#d6ffe0)', marginBottom: 12, fontFamily: 'inherit' }} />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--tx,#d6ffe0)', marginBottom: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={editSettings.show_tally_link} onChange={e => setEditSettings(s => ({...s, show_tally_link: e.target.checked}))} style={{ width: 16, height: 16, accentColor: 'var(--gold,#ffd23f)' }} />
              ENABLE TALLY FORM BUTTON IN CONTRIBUTORS TAB
            </label>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="font-pixel"
              style={{ width: '100%', fontSize: 10, padding: '14px 20px', background: savingSettings ? '#4a3a5a' : 'var(--gold,#ffd23f)', color: '#0e1512', border: 'none', borderRadius: 8, cursor: savingSettings ? 'wait' : 'pointer', letterSpacing: '.5px' }}
            >
              {savingSettings ? '⏳ SAVING...' : '💾 SAVE SETTINGS'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Preview Modal ═══ */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          bookmarked={isBookmarked(previewItem)}
          bookmarkSource={getBookmarkSource(previewItem)}
          onClose={() => setPreview(null)}
          onBookmark={() => onBookmark && onBookmark('contrib-' + previewItem.id, previewItem.title, 'Showcase · ' + previewItem.theme, previewItem.url || undefined, previewItem.previewUrl ? JSON.stringify({ previewUrl: previewItem.previewUrl }) : undefined)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ContributionCard
   ═══════════════════════════════════════════════════════════════ */
function ContributionCard({ item, bookmarked, bookmarkSource, onOpen, onBookmark }: {
  item: ShowcaseItem
  bookmarked: boolean
  bookmarkSource?: string | null
  onOpen: () => void
  onBookmark: () => Promise<void> | void
}) {
  const [isBookmarking, setIsBookmarking] = useState(false)
  const clr = TYPE_COLOR[item.type] || '#45d6ff'

  return (
    <div style={{
      border: '2px solid var(--ln,#3d2668)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--pn,#241542)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* thumbnail area */}
      <div style={{
        height: 132,
        background: `linear-gradient(135deg,${clr}22,${clr}08)`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Show actual media preview if URL is available */}
        {item.url && isImageUrl(item.url) ? (
          <img
            src={item.url}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')) ? (
          <>
            <img
              src={`https://img.youtube.com/vi/${item.url.includes('youtu.be/') ? item.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(item.url.split('?')[1] || '').get('v')}/mqdefault.jpg`}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, color: '#fff', marginLeft: 3 }}>▶</span>
              </div>
            </div>
          </>
        ) : item.url && item.url.match(/\.(mp4|webm|mov)/i) ? (
          <>
            <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, color: '#fff', marginLeft: 3 }}>▶</span>
              </div>
            </div>
          </>
        ) : item.previewUrl ? (
          /* Admin-uploaded preview image (stored in meta JSON) */
          <img
            src={item.previewUrl}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          /* fallback type icon */
          <span style={{ fontSize: 38, opacity: .18, color: clr }}>
            {item.type === 'video' ? '▶' : item.type === 'audio' ? '♫' : item.type === 'aigen' ? '✦' : item.type === 'image' ? '📷' : '✎'}
          </span>
        )}

        {/* type badge */}
        <span className="font-pixel" style={{
          position: 'absolute',
          top: 8,
          left: 8,
          fontSize: 7,
          padding: '3px 7px',
          borderRadius: 4,
          background: clr,
          color: '#12081e',
          letterSpacing: '.5px',
        }}>
          {TYPE_LABEL[item.type]}
        </span>

        {/* paid badge */}
        {item.paid && (
          <span className="font-pixel" style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 7,
            padding: '3px 7px',
            borderRadius: 4,
            background: 'rgba(255,210,63,.18)',
            color: 'var(--gold,#ffd23f)',
            border: '1px solid rgba(255,210,63,.3)',
          }}>
            ★ PREMIUM
          </span>
        )}
      </div>

      {/* content area */}
      <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <h3 className="font-pixel" style={{
          fontSize: 10,
          color: '#fff',
          margin: 0,
          lineHeight: 1.6,
        }}>
          {item.title}
        </h3>

        <span style={{ fontSize: 15, color: 'var(--mu,#a493c9)' }}>
          {item.author} · {item.meta}
        </span>

        {/* Project Type */}
        {item.projectType && (
          <span style={{ fontSize: 15, color: 'var(--mu,#a493c9)', display: 'block', marginTop: 4 }}>
            Project type: {PROJECT_TYPE_LABELS[item.projectType] || item.projectType}
          </span>
        )}

        <p style={{
          fontSize: 15,
          color: '#fff',
          margin: 0,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.blurb}
        </p>

        <span style={{ fontSize: 12, color: 'var(--s,#45d6ff)', marginTop: 2 }}>
          ◈ Library · {item.theme}
        </span>

        {/* button row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button
            onClick={onOpen}
            className="font-pixel"
            style={{
              flex: 1,
              fontSize: 9,
              fontWeight: 'normal',
              padding: '8px 10px',
              borderRadius: 5,
              border: 'none',
              background: 'var(--s,#45d6ff)',
              color: '#12081e',
              cursor: 'pointer',
              letterSpacing: '.5px',
            }}
          >
            OPEN SAMPLE ▸
          </button>

          <button
            disabled={isBookmarking}
            onClick={async (e) => { 
              if (bookmarkSource === 'library') {
                if (e && e.stopPropagation) e.stopPropagation();
                toast('Already bookmarked in Library', { icon: '★' });
                return;
              }
              e.stopPropagation(); 
              setIsBookmarking(true);
              try {
                await onBookmark();
              } finally {
                setIsBookmarking(false);
              }
            }}
            title={bookmarkSource === 'library' ? 'Bookmarked in Library' : bookmarked ? 'Remove bookmark' : 'Bookmark this creation'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 5,
              border: '2px solid var(--s,#45d6ff)',
              background: bookmarked ? 'var(--s,#45d6ff)' : 'transparent',
              color: bookmarked ? '#12081e' : 'var(--s,#45d6ff)',
              cursor: bookmarkSource === 'library' ? 'not-allowed' : (isBookmarking ? 'wait' : 'pointer'),
              opacity: (bookmarkSource === 'library' || isBookmarking) ? 0.6 : 1,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {isBookmarking ? <Loader2 size={16} className="animate-spin" /> : (bookmarked ? '★' : '☆')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PreviewModal
   ═══════════════════════════════════════════════════════════════ */
function PreviewModal({ item, bookmarked, bookmarkSource, onClose, onBookmark }: {
  item: ShowcaseItem
  bookmarked: boolean
  bookmarkSource?: string | null
  onClose: () => void
  onBookmark: () => void
}) {
  const clr = TYPE_COLOR[item.type] || '#45d6ff'

  /* deterministic "random" heights for waveform bars */
  const waveHeights = useMemo(() =>
    Array.from({ length: 34 }, (_, i) => {
      const seed = ((i + 1) * 2654435761) >>> 0
      return 8 + (seed % 34)
    })
  , [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(6,3,14,.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '88vh',
          overflowY: 'auto',
          border: '2px solid var(--ln,#3d2668)',
          borderRadius: 12,
          background: 'var(--pn,#241542)',
          position: 'relative',
        }}
      >
        {/* header gradient - only show when no embeddable media URL */}
        {!(item.url && (isImageUrl(item.url) || item.url.includes('youtube.com') || item.url.includes('youtu.be') || item.url.match(/\.(mp4|webm|mov|mp3|wav|ogg|aac|flac)/i))) && (
          <div style={{
            height: 150,
            background: item.previewUrl ? undefined : `linear-gradient(135deg,${clr}33,${clr}0a)`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {item.previewUrl ? (
              /* Admin-uploaded preview image */
              <img
                src={item.previewUrl}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span style={{ fontSize: 52, opacity: .14, color: clr }}>
                {item.type === 'video' ? '▶' : item.type === 'audio' ? '♫' : item.type === 'aigen' ? '✦' : item.type === 'image' ? '📷' : '✎'}
              </span>
            )}

            {/* type badge */}
            <span className="font-pixel" style={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontSize: 7,
              padding: '3px 8px',
              borderRadius: 4,
              background: clr,
              color: '#12081e',
            }}>
              {TYPE_LABEL[item.type]}
            </span>
          </div>
        )}

        {/* close btn - always visible */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            width: 34,
            height: 34,
            borderRadius: 6,
            border: '2px solid var(--ln,#3d2668)',
            background: 'var(--pn,#241542)',
            color: 'var(--tx,#efe6ff)',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          ✕
        </button>

        {/* content */}
        <div style={{ padding: '18px 22px 22px' }}>
          {/* theme tag */}
          <span style={{ fontSize: 13, color: 'var(--s,#45d6ff)' }}>
            ◈ Library · {item.theme}
          </span>

          <h2 className="font-pixel" style={{
            fontSize: 12,
            color: '#fff',
            margin: '10px 0 4px',
            lineHeight: 1.6,
          }}>
            {item.title}
          </h2>

          <p style={{
            fontSize: 15,
            color: 'var(--mu,#a493c9)',
            margin: '0 0 16px',
          }}>
            {item.author} · {item.meta}
          </p>

          {/* Project Type */}
          {item.projectType && (
            <p style={{
              fontSize: 15,
              color: 'var(--mu,#a493c9)',
              margin: '0 0 16px',
            }}>
              Project type: {PROJECT_TYPE_LABELS[item.projectType] || item.projectType}
            </p>
          )}

          {/* ── type-specific preview ── */}
          {item.type === 'video' && item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')) ? (
            <div style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', border: `1px solid ${clr}33`, marginBottom: 4 }}>
              <iframe
                src={`https://www.youtube.com/embed/${item.url.includes('youtu.be/') ? item.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(item.url.split('?')[1] || '').get('v')}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : item.type === 'video' && item.url && item.url.match(/\.(mp4|webm|mov)/i) ? (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${clr}33`, marginBottom: 4 }}>
              <video src={item.url} controls preload="metadata" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : item.type === 'video' && !item.url ? (
            <VideoPreview clr={clr} />
          ) : null}
          {item.type === 'audio' && item.url && item.url.match(/\.(mp3|wav|ogg|aac|flac)/i) ? (
            <div style={{ borderRadius: 8, border: `1px solid ${clr}33`, padding: 14, marginBottom: 4, background: `linear-gradient(135deg,${clr}12,${clr}04)` }}>
              <audio src={item.url} controls style={{ width: '100%' }} />
            </div>
          ) : item.type === 'audio' ? (
            <AudioPreview clr={clr} waveHeights={waveHeights} />
          ) : null}
          {item.url && isImageUrl(item.url) && (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${clr}33`, marginBottom: 4 }}>
              <img src={item.url} alt={item.title} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block', background: 'rgba(0,0,0,.2)' }} />
            </div>
          )}

          {/* blurb */}
          <p style={{
            fontSize: 16,
            color: '#fff',
            lineHeight: 1.6,
            margin: '16px 0 20px',
          }}>
            {item.blurb}
          </p>

          {/* action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-pixel"
                style={{
                  fontSize: 9,
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--s,#45d6ff)',
                  color: '#12081e',
                  cursor: 'pointer',
                  letterSpacing: '.5px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ↗ VIEW CREATION
              </a>
            )}
            <button
              onClick={async () => {
                // Search for the library resource by title and URL
                try {
                  const params = new URLSearchParams();
                  if (item.title) params.set('title', item.title);
                  if (item.url) params.set('url', item.url);
                  
                  const res = await fetch(`/api/public/library-resources/search?${params.toString()}`);
                  const data = await res.json();
                  
                  if (data.id) {
                    window.open(`/hub/library/${data.id}`, '_blank');
                  } else {
                    // Fallback: open the URL directly
                    window.open(item.url || '/hub/library?category=how-to-use-ai', '_blank');
                  }
                } catch {
                  window.open(item.url || '/hub/library?category=how-to-use-ai', '_blank');
                }
              }}
              className="font-pixel"
              style={{
                fontSize: 9,
                padding: '9px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--gold,#ffd23f)',
                color: '#12081e',
                cursor: 'pointer',
                letterSpacing: '.5px',
              }}
            >
              ▶ OPEN IN LIBRARY ↗
            </button>

            <button
              onClick={onBookmark}
              className="font-pixel"
              style={{
                fontSize: 9,
                padding: '9px 16px',
                borderRadius: 6,
                border: '2px solid var(--s,#45d6ff)',
                background: bookmarked ? 'var(--s,#45d6ff)' : 'transparent',
                color: bookmarked ? '#12081e' : 'var(--s,#45d6ff)',
                cursor: 'pointer',
                letterSpacing: '.5px',
              }}
            >
              {bookmarked ? '★ BOOKMARKED' : '＋ BOOKMARK TO MY DESK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Video fake player ── */
function VideoPreview({ clr }: { clr: string }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      background: `linear-gradient(135deg,${clr}18,${clr}06)`,
      height: 180,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${clr}33`,
      marginBottom: 4,
    }}>
      {/* play triangle */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '22px solid #fff',
        borderTop: '14px solid transparent',
        borderBottom: '14px solid transparent',
        opacity: .7,
      }} />
      {/* SAMPLE CLIP label */}
      <span className="font-pixel" style={{
        position: 'absolute',
        bottom: 10,
        left: 12,
        fontSize: 7,
        color: clr,
        opacity: .8,
        letterSpacing: '.5px',
      }}>
        SAMPLE CLIP
      </span>
    </div>
  )
}

/* ── Audio waveform ── */
function AudioPreview({ clr, waveHeights }: { clr: string; waveHeights: number[] }) {
  return (
    <div style={{
      borderRadius: 8,
      border: `1px solid ${clr}33`,
      background: `linear-gradient(135deg,${clr}12,${clr}04)`,
      padding: '16px 14px',
      marginBottom: 4,
    }}>
      {/* waveform bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 3,
        height: 44,
        marginBottom: 10,
      }}>
        {waveHeights.map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: h,
            borderRadius: 2,
            background: clr,
            opacity: .55,
          }} />
        ))}
      </div>

      {/* play button + progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${clr}`,
          background: 'transparent',
          color: clr,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
        }}>
          ▶
        </button>
        <div style={{
          flex: 1,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '35%',
            height: '100%',
            borderRadius: 2,
            background: clr,
          }} />
        </div>
        <span className="font-pixel" style={{ fontSize: 7, color: clr, opacity: .7 }}>
          0:00
        </span>
      </div>
    </div>
  )
}

/* ── AI-gen grid ── */
function AiGenPreview({ clr }: { clr: string }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 6,
      marginBottom: 4,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          aspectRatio: '1',
          borderRadius: 6,
          background: `linear-gradient(${135 + i * 30}deg,${clr}22,${clr}08)`,
          border: `1px solid ${clr}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 18, opacity: .15, color: clr }}>✦</span>
        </div>
      ))}
    </div>
  )
}
