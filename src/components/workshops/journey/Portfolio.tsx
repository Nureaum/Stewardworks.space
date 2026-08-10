'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { PixelSprite, buildIconUri } from '@/components/workshops/journey'
import { DEFAULT_CHARACTER } from './character-data'
import { PATHWAYS, QUIZZES } from '@/data/workforce-content'
import { fetchUserPicks } from '@/app/admin/workforce-pathways/actions'
import { uploadCreationImage } from '@/app/actions/workshops/engagement'
import { calculateGlobalEngagement } from '@/lib/progress/calculateGlobalEngagement'
import DeliverableMediaPreview, { isImageUrl } from '@/components/workshops/DeliverableMediaPreview'
import RichTextEditor from '@/components/admin/RichTextEditor'
import PathwayCardDownload from '@/components/shared/PathwayCardDownload'
import type {
  WorkshopCharacter,
  DayWithSections,
  WorkshopProgress,
  WorkshopProgressPrinciple,
  WorkshopEngagement,
} from '@/types/workshops'

/* ── Props ── */
interface PortfolioProps {
  character: WorkshopCharacter
  days: DayWithSections[]
  progressRows: WorkshopProgress[]
  bankedPrinciples: WorkshopProgressPrinciple[]
  engagements: WorkshopEngagement[]
  submissions?: any[]
  onAddEngagement: (kind: string, title: string, source: string, url?: string, content?: string) => void
  onRemoveEngagement: (id: string) => void
  onUpdateEngagement?: (id: string, updates: { title?: string, content?: string, url?: string }) => void
  // Certificate data
  cohortId: string
  cohortName: string
  userId?: string
  userRole?: string
}

/* ── Parse Note Content Helper ── */
const parseNoteContent = (contentStr: string | null) => {
  if (!contentStr) return { text: '', html: '', images: [], subType: 'note', version: 1 };
  try {
    const parsed = JSON.parse(contentStr);
    if (parsed && typeof parsed === 'object') {
      if (parsed.version === 2) {
        return parsed;
      }
      // Handle legacy or specific JSON payloads
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

/* ── Helpers ── */
const ENGPCT: Record<string, number> = { bookmark: 1, note: 1, generation: 2, prompt: 3, mini_deliverable: 4 }

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  not_submitted: { label: 'NOT SUBMITTED', color: '#a493c9' },
  submitted:     { label: 'PENDING REVIEW', color: '#ffd23f' },
  approved:      { label: 'APPROVED · +25%', color: '#74f0a0' },
  rejected:      { label: 'NEEDS REVISION', color: '#ff8a4a' },
}

const SHELF_COLS: { kind: string; icon: string; label: string; color: string }[] = [
  { kind: 'bookmark', icon: '☆', label: 'BOOKMARKS', color: 'var(--s,#45d6ff)' },
  { kind: 'note',     icon: '✎', label: 'NOTES',     color: 'var(--gold,#ffd23f)' },
  { kind: 'prompt',   icon: '⌘', label: 'SAVED PROMPTS', color: 'var(--p,#ff5fd2)' },
  { kind: 'mini_deliverable', icon: '🏆', label: 'MINI DELIVERABLES', color: 'var(--v,#b06bff)' },
]

const ASSET_GRADIENTS: Record<string, string> = {
  generation: 'linear-gradient(135deg,#45d6ff 0%,#74f0a0 100%)',
  default:    'linear-gradient(135deg,#b06bff 0%,#ff5fd2 100%)',
}

function chiaRects(stage: number) {
  const gL='#daba4e',gM='#c19a33',gD='#9c7a28',eye='#3a2c14',bD='#1c150f',bM='#33281b',gr='#5fa83c',gr2='#8fd85f',fp='#ff5fd2',fy='#ffd23f',fv='#b06bff';
  const r=[
    [2,18,12,2,bD],[3,18,10,1,bM],
    [6,11,4,1,gL],[5,12,6,1,gM],[5,13,6,1,gM],[4,14,8,1,gM],[4,15,8,1,gD],[3,16,10,1,gM],[3,17,10,1,gD],
    [5,16,6,1,gL],
    [7,10,2,1,gM],
    [6,5,4,1,gL],[5,6,6,1,gL],[5,7,6,1,gM],[5,8,6,1,gM],[6,9,4,1,gD],
    [6,7,1,1,eye],[9,7,1,1,eye]
  ] as any[];
  const S: any[]=[];
  const defs: Record<number, any[]>={
    1:[[6,3,1,2,gr],[8,3,1,2,gr],[7,2,1,3,gr],[7,2,1,1,gr2]],
    2:[[5,2,1,3,gr],[7,1,1,4,gr],[9,2,1,3,gr],[8,2,1,3,gr],[7,1,1,1,gr2],[5,2,1,1,gr2],[9,2,1,1,gr2]],
    3:[[5,1,1,4,gr],[6,2,1,3,gr],[7,0,1,5,gr],[8,1,1,4,gr],[9,2,1,3,gr],[10,3,1,2,gr],[7,0,1,1,gr2],[5,1,1,1,gr2],[9,2,1,1,gr2]],
    4:[[4,3,1,2,gr],[5,1,1,4,gr],[6,0,1,5,gr],[7,0,1,5,gr],[8,1,1,4,gr],[9,0,1,5,gr],[10,2,1,3,gr],[6,0,1,1,gr2],[9,0,1,1,gr2],[7,0,1,1,gr2]]
  };
  if(stage>=1&&stage<5)(defs[stage]||[]).forEach(x=>S.push(x));
  if(stage>=5){
    [[5,2,1,3,gr],[6,1,1,3,gr],[9,1,1,3,gr],[10,2,1,3,gr],[7,2,1,2,gr],[8,2,1,2,gr]].forEach(x=>S.push(x));
    [[4,0,2,2,fp],[7,0,2,2,fy],[10,0,2,2,fv]].forEach(x=>S.push(x));
  }
  return r.concat(S);
}

function buildChiaUri(stage: number, accent: string) {
  const rects = chiaRects(stage);
  const body = rects.map(a => `<rect x='${a[0]}' y='${a[1]}' width='${a[2]}' height='${a[3]}' fill='${a[4]==='A'?accent:a[4]}'/>`).join('');
  return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20' shape-rendering='crispEdges'>${body}</svg>`);
}

export default function Portfolio({
  character,
  days,
  progressRows,
  bankedPrinciples,
  engagements,
  submissions = [],
  onAddEngagement,
  onRemoveEngagement,
  onUpdateEngagement,
  cohortId,
  cohortName,
  userId,
  userRole = 'participant',
}: PortfolioProps) {
  /* ── Clerk user for workforce picks ── */
  const { user } = useUser()
  
  /* ── Local input state ── */
  const [bookmarkInput, setBookmarkInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [promptInput, setPromptInput] = useState('')
  const [isNoteMiniDeliverable, setIsNoteMiniDeliverable] = useState(false)
  const [isPromptMiniDeliverable, setIsPromptMiniDeliverable] = useState(false)
  
  // Rich text editor states for notes/prompts
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [richNoteTitle, setRichNoteTitle] = useState('')
  const [richNoteContent, setRichNoteContent] = useState('')
  const [richPromptTitle, setRichPromptTitle] = useState('')
  const [richPromptContent, setRichPromptContent] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  
  // Bookmark editor states
  const [showBookmarkEditor, setShowBookmarkEditor] = useState(false)
  const [richBookmarkTitle, setRichBookmarkTitle] = useState('')
  const [richBookmarkUrl, setRichBookmarkUrl] = useState('')
  const [richBookmarkContent, setRichBookmarkContent] = useState('')

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({ title: '', content: '', url: '' })
  const [assetInput, setAssetInput] = useState('')
  const [assetFileToUpload, setAssetFileToUpload] = useState<File | null>(null)
  const [isUploadingAsset, setIsUploadingAsset] = useState(false)
  const [assetShowcaseSubmit, setAssetShowcaseSubmit] = useState(false)
  const assetFileInputRef = useRef<HTMLInputElement>(null)
  // Preview image for non-media URL submissions
  const [assetPreviewFile, setAssetPreviewFile] = useState<File | null>(null)
  const [assetPreviewObjectUrl, setAssetPreviewObjectUrl] = useState<string | null>(null)
  const assetPreviewFileInputRef = useRef<HTMLInputElement>(null)
  const [bookmarkFileToUpload, setBookmarkFileToUpload] = useState<File | null>(null)
  const [isUploadingBookmark, setIsUploadingBookmark] = useState(false)
  const bookmarkFileInputRef = useRef<HTMLInputElement>(null)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  // Workforce Pathway Picks State
  const [workforcePicks, setWorkforcePicks] = useState<any[]>([])
  const [loadingWorkforcePicks, setLoadingWorkforcePicks] = useState(false)
  const [expandedPathwayCard, setExpandedPathwayCard] = useState<string | null>(null)

  // Certificate State
  const [showCertPreview, setShowCertPreview] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [certSettings, setCertSettings] = useState({
    certOrg: 'StewardWorks',
    certFacilitator: 'Marisol Vega',
    certFacTitle: 'Program Director',
    certSponsor: 'Dr. Jane Smith',
    certSponsorOrg: 'SDSU Research Foundation',
    certMessage: ''
  })

  // Load workforce pathway picks - uses Clerk user.id
  const loadWorkforcePicks = useCallback(async () => {
    if (!user?.id) return
    setLoadingWorkforcePicks(true)
    try {
      const picks = await fetchUserPicks(user.id)
      setWorkforcePicks(picks || [])
    } catch (error) {
      console.error('Failed to load workforce picks:', error)
    } finally {
      setLoadingWorkforcePicks(false)
    }
  }, [user?.id])

  // Load certificate settings
  const loadCertSettings = useCallback(async () => {
    if (!cohortId) return
    try {
      const response = await fetch(`/api/workshops/${cohortId}/certificate-settings`)
      if (response.ok) {
        const settings = await response.json()
        setCertSettings({
          certOrg: settings.certOrg || 'StewardWorks',
          certFacilitator: settings.certFacilitator || 'Marisol Vega',
          certFacTitle: settings.certFacTitle || 'Program Director',
          certSponsor: settings.certSponsor || 'Dr. Jane Smith',
          certSponsorOrg: settings.certSponsorOrg || 'SDSU Research Foundation',
          certMessage: settings.certMessage || ''
        })
      }
    } catch (e) {
      console.error('Failed to fetch certificate settings:', e)
    }
  }, [cohortId])

  useEffect(() => {
    loadWorkforcePicks()
    loadCertSettings()
  }, [loadWorkforcePicks, loadCertSettings])

  // Helper to get user's answer label for a pick
  const getAnswerLabel = (pick: any, pathwayId: string, stopId: string) => {
    if (pick.custom_answer) return pick.custom_answer
    if (pick.option_id) {
      const quizData = (QUIZZES as any)[pathwayId]?.[stopId]
      if (quizData?.options) {
        const option = quizData.options.find((o: any) => o.id === pick.option_id)
        return option?.label || pick.option_id
      }
    }
    return 'No answer'
  }

  const inputState: Record<string, { value: string; set: (v: string) => void }> = {
    bookmark: { value: bookmarkInput, set: setBookmarkInput },
    note:     { value: noteInput,     set: setNoteInput },
    prompt:   { value: promptInput,   set: setPromptInput },
  }



  const viewingItem = engagements.find(e => e.id === viewingId)
  const editingItem = engagements.find(e => e.id === editingId)

  const handleStartEdit = (id: string) => {
    console.log('[Portfolio] handleStartEdit called with id:', id)
    const item = engagements.find(e => e.id === id)
    console.log('[Portfolio] Found item:', item)
    if (item) {
      // Parse content if it has version 2 format (notes, prompts, bookmarks with descriptions)
      let contentToEdit = item.content || '';
      if (item.kind === 'note' || item.kind === 'prompt' || item.kind === 'mini_deliverable' || item.kind === 'bookmark') {
        const parsed = parseNoteContent(item.content);
        // Use HTML for rich text editor
        contentToEdit = parsed.html || parsed.text || item.content || '';
      }
      
      const draft = { title: item.title, content: contentToEdit, url: item.url || '' }
      console.log('[Portfolio] Setting edit draft:', draft)
      setEditDraft(draft)
      setEditingId(id)
      setViewingId(null)
    }
  }

  const handleSaveEdit = async (e?: React.FormEvent) => {
    console.log('[Portfolio] handleSaveEdit CALLED')
    console.log('[Portfolio] Event:', e)
    console.log('[Portfolio] editingId:', editingId)
    console.log('[Portfolio] editDraft:', editDraft)
    console.log('[Portfolio] onUpdateEngagement exists:', !!onUpdateEngagement)
    
    e?.preventDefault() // Prevent form submission if called from form
    
    if (!editingId) {
      console.error('[Portfolio] No editingId - aborting save')
      return
    }
    
    if (!onUpdateEngagement) {
      console.error('[Portfolio] No onUpdateEngagement handler - aborting save')
      return
    }
    
    try {
      // Get the original item
      const item = engagements.find(e => e.id === editingId)
      
      // Check if user uploaded a new file for bookmark
      if (item && item.kind === 'bookmark' && bookmarkFileToUpload) {
        setIsUploadingBookmark(true)
        const formData = new FormData()
        formData.append('file', bookmarkFileToUpload)
        
        try {
          const publicUrl = await uploadCreationImage(formData)
          // Update URL with new uploaded file URL
          editDraft.url = publicUrl
          setBookmarkFileToUpload(null)
        } catch (err) {
          console.error('Failed to upload new file:', err)
          alert('Failed to upload new file. Please try again.')
          return
        } finally {
          setIsUploadingBookmark(false)
        }
      }
      
      let contentToSave = editDraft.content;
      
      if (item && (item.kind === 'note' || item.kind === 'prompt' || item.kind === 'mini_deliverable' || (item.kind === 'bookmark' && editDraft.content.trim()))) {
        // Content is already HTML from RichTextEditor, save in version 2 format
        const plainText = editDraft.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Save in version 2 format
        contentToSave = JSON.stringify({
          version: 2,
          html: editDraft.content || `<p>${plainText}</p>`,
          text: plainText,
          images: [],
          subType: item.kind === 'mini_deliverable' ? 'note' : item.kind
        });
      }
      
      console.log('[Portfolio] Calling onUpdateEngagement with:', {
        id: editingId,
        updates: {
          title: editDraft.title || editDraft.content.slice(0, 50),
          content: contentToSave,
          url: editDraft.url,
        }
      })
      
      const result = await onUpdateEngagement(editingId, {
        title: editDraft.title || editDraft.content.slice(0, 50),
        content: contentToSave,
        url: editDraft.url,
      })
      
      console.log('[Portfolio] onUpdateEngagement returned:', result)
      console.log('[Portfolio] Closing edit modal')
      setEditingId(null)
    } catch (e) {
      console.error('[Portfolio] Save edit failed:', e)
      throw e
    }
  }

  /* ── Chia growth calculations ── */
  const apprDeliv = progressRows.filter(p => p.deliverable_status === 'approved').length
  const delivPct = Math.min(apprDeliv * 25, 75)
  const engPct = calculateGlobalEngagement(engagements)
  const chiaPct = Math.min(delivPct + engPct, 100)
  const stageNum =
    chiaPct >= 100
      ? 5
      : chiaPct >= 75
        ? 4
        : chiaPct >= 50
          ? 3
          : chiaPct >= 25
            ? 2
            : chiaPct > 0
              ? 1
              : 0

  const stage = ['Bare bud', 'Sprouting', 'Filling in', 'Leafy crown', 'Lush mane', 'Full bloom 🌸'][stageNum] || 'Bare bud'

  const deskChiaUri = useMemo(() => buildChiaUri(stageNum, character.accent_color || '#ff5fd2'), [stageNum, character.accent_color])

  /* ── Engagement stats ── */
  const approvedCount = engagements.filter(e => e.status === 'approved').length
  const pendingCount = engagements.filter(e => e.status === 'pending').length

  /* ── Helper: Detect media type from URL ── */
  const detectMediaType = (url: string) => {
    const lower = url.toLowerCase()
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i.test(lower)) return 'image'
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(lower) || lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) return 'video'
    if (/\.(mp3|wav|ogg|aac|flac)(\?|#|$)/i.test(lower)) return 'audio'
    return 'link'
  }

  /* ── Engagement items per kind ── */
  const engByKind = useMemo(() => {
    const map: Record<string, WorkshopEngagement[]> = { bookmark: [], note: [], prompt: [], mini_deliverable: [], generation: [] }
    engagements.forEach(e => {
      let bucket = e.kind
      // Keep mini_deliverables in their own category
      if (e.kind === 'mini_deliverable') {
        bucket = 'mini_deliverable'
      }
      if (map[bucket]) map[bucket].push(e)
      else map[bucket] = [e]
    })
    return map
  }, [engagements])

  /* ── Progress per day ── */
  const progressByDay = useMemo(() => {
    const map: Record<string, WorkshopProgress> = {}
    progressRows.forEach(p => { map[p.workshop_day_id] = p })
    return map
  }, [progressRows])

  /* ── Handler helpers ── */
  function handleAddShelf(kind: string) {
    const st = inputState[kind]
    if (!st || !st.value.trim() && !bookmarkFileToUpload) return
    if (kind === 'bookmark' && bookmarkFileToUpload) {
      // Handle file upload for bookmark
      setIsUploadingBookmark(true)
      const formData = new FormData()
      formData.append('file', bookmarkFileToUpload)
      uploadCreationImage(formData)
        .then((publicUrl) => {
          onAddEngagement('bookmark', bookmarkFileToUpload!.name, 'upload', publicUrl)
          setBookmarkFileToUpload(null)
          if (st) st.set('')
        })
        .catch(err => console.error('Bookmark upload failed:', err))
        .finally(() => setIsUploadingBookmark(false))
      return
    }
    if (!st || !st.value.trim()) return
    
    let finalKind = kind
    let contentPayload: string | undefined = undefined
    let title = st.value.trim()
    let url: string | undefined = undefined

    if (kind === 'note' && isNoteMiniDeliverable) {
      finalKind = 'mini_deliverable'
      contentPayload = JSON.stringify({ originalKind: 'note' })
    }
    if (kind === 'prompt' && isPromptMiniDeliverable) {
      finalKind = 'mini_deliverable'
      contentPayload = JSON.stringify({ originalKind: 'prompt' })
    }
    
    if (kind === 'bookmark') {
      url = title
      if (title.includes('/library/')) {
        title = 'Library Resource'
      } else if (title.includes('/workforce-pathways')) {
        title = 'Workforce Pathway'
      } else if (title.startsWith('http')) {
        try {
          title = new URL(title).hostname
        } catch {
          title = 'Bookmarked Link'
        }
      } else if (title.match(/^[0-9a-fA-F-]{36}$/)) {
        title = 'Bookmarked Resource'
      } else {
        title = 'Bookmarked Link'
      }
    }
    
    onAddEngagement(finalKind, title, `workshop:${cohortId}`, url, contentPayload)
    
    st.set('')
    if (kind === 'note') setIsNoteMiniDeliverable(false)
    if (kind === 'prompt') setIsPromptMiniDeliverable(false)
  }
  
  // Handler for rich text note submission
  function handleSubmitRichNote() {
    if (!richNoteTitle.trim() || !richNoteContent.trim()) return
    
    setIsSavingNote(true)
    const plainText = richNoteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const contentJson = JSON.stringify({
      version: 2,
      html: richNoteContent,
      text: plainText,
      images: [],
      subType: 'note'
    })
    
    const finalKind = isNoteMiniDeliverable ? 'mini_deliverable' : 'note'
    onAddEngagement(finalKind, richNoteTitle.trim(), `workshop:${cohortId}`, undefined, contentJson)
    
    setRichNoteTitle('')
    setRichNoteContent('')
    setIsNoteMiniDeliverable(false)
    setShowNoteEditor(false)
    setIsSavingNote(false)
  }
  
  // Handler for rich text prompt submission
  function handleSubmitRichPrompt() {
    if (!richPromptTitle.trim() || !richPromptContent.trim()) return
    
    setIsSavingNote(true)
    const plainText = richPromptContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const contentJson = JSON.stringify({
      version: 2,
      html: richPromptContent,
      text: plainText,
      images: [],
      subType: 'prompt'
    })
    
    const finalKind = isPromptMiniDeliverable ? 'mini_deliverable' : 'prompt'
    onAddEngagement(finalKind, richPromptTitle.trim(), `workshop:${cohortId}`, undefined, contentJson)
    
    setRichPromptTitle('')
    setRichPromptContent('')
    setIsPromptMiniDeliverable(false)
    setShowPromptEditor(false)
    setIsSavingNote(false)
  }
  
  // Handler for bookmark submission
  function handleSubmitBookmark() {
    if (!richBookmarkUrl.trim() && !bookmarkFileToUpload) return
    
    if (bookmarkFileToUpload) {
      // Handle file upload for bookmark
      setIsUploadingBookmark(true)
      const formData = new FormData()
      formData.append('file', bookmarkFileToUpload)
      uploadCreationImage(formData)
        .then((publicUrl) => {
          const title = richBookmarkTitle.trim() || bookmarkFileToUpload!.name
          
          // Save description in version 2 format if provided
          let contentPayload: string | undefined = undefined
          if (richBookmarkContent.trim()) {
            const plainText = richBookmarkContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            contentPayload = JSON.stringify({
              version: 2,
              html: richBookmarkContent,
              text: plainText,
              images: [],
              subType: 'bookmark'
            })
          }
          
          onAddEngagement('bookmark', title, `workshop:${cohortId}`, publicUrl, contentPayload)
          setBookmarkFileToUpload(null)
          setRichBookmarkTitle('')
          setRichBookmarkUrl('')
          setRichBookmarkContent('')
          setShowBookmarkEditor(false)
        })
        .catch(err => console.error('Bookmark upload failed:', err))
        .finally(() => setIsUploadingBookmark(false))
      return
    }
    
    const url = richBookmarkUrl.trim()
    let title = richBookmarkTitle.trim()
    
    // Auto-generate title if not provided
    if (!title) {
      if (url.includes('/library/')) {
        title = 'Library Resource'
      } else if (url.includes('/workforce-pathways')) {
        title = 'Workforce Pathway'
      } else if (url.startsWith('http')) {
        try {
          title = new URL(url).hostname
        } catch {
          title = 'Bookmarked Link'
        }
      } else if (url.match(/^[0-9a-fA-F-]{36}$/)) {
        title = 'Bookmarked Resource'
      } else {
        title = 'Bookmarked Link'
      }
    }
    
    // Save description in version 2 format if provided
    let contentPayload: string | undefined = undefined
    if (richBookmarkContent.trim()) {
      const plainText = richBookmarkContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      contentPayload = JSON.stringify({
        version: 2,
        html: richBookmarkContent,
        text: plainText,
        images: [],
        subType: 'bookmark'
      })
    }
    
    onAddEngagement('bookmark', title, `workshop:${cohortId}`, url, contentPayload)
    setRichBookmarkTitle('')
    setRichBookmarkUrl('')
    setRichBookmarkContent('')
    setShowBookmarkEditor(false)
  }

  function handleBookmarkFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBookmarkFileToUpload(file)
    const st = inputState['bookmark']
    if (st) st.set(file.name)
    if (bookmarkFileInputRef.current) bookmarkFileInputRef.current.value = ''
  }

  function handleAddAsset() {
    if (!assetInput.trim() && !assetFileToUpload) return
    
    if (assetFileToUpload) {
      // Handle direct file upload (image/video/audio) — no preview needed
      setIsUploadingAsset(true)
      const formData = new FormData()
      formData.append('file', assetFileToUpload)
      uploadCreationImage(formData)
        .then((publicUrl) => {
          const contentData = JSON.stringify({
            showcaseRequested: assetShowcaseSubmit,
            showcaseVisible: false,
          })
          onAddEngagement('generation', assetFileToUpload.name, 'upload', publicUrl, contentData)
          setAssetFileToUpload(null)
          setAssetInput('')
          setAssetShowcaseSubmit(false)
        })
        .catch((err) => console.error('Failed to upload asset:', err))
        .finally(() => setIsUploadingAsset(false))
    } else if (assetPreviewFile) {
      // Non-media URL + uploaded preview image
      setIsUploadingAsset(true)
      const formData = new FormData()
      formData.append('file', assetPreviewFile)
      uploadCreationImage(formData)
        .then((previewUrl) => {
          const url = assetInput.trim()
          const contentJson = JSON.stringify({ 
            url, 
            previewUrl,
            showcaseRequested: assetShowcaseSubmit,
            showcaseVisible: false,
          })
          onAddEngagement('generation', url, 'link', url, contentJson)
          setAssetInput('')
          setAssetPreviewFile(null)
          if (assetPreviewObjectUrl) URL.revokeObjectURL(assetPreviewObjectUrl)
          setAssetPreviewObjectUrl(null)
          setAssetShowcaseSubmit(false)
        })
        .catch((err) => console.error('Failed to upload asset preview:', err))
        .finally(() => setIsUploadingAsset(false))
    } else {
      const contentData = JSON.stringify({
        showcaseRequested: assetShowcaseSubmit,
        showcaseVisible: false,
      })
      onAddEngagement('generation', assetInput.trim(), 'link', assetInput.trim(), contentData)
      setAssetInput('')
      setAssetShowcaseSubmit(false)
    }
  }

  function handleAssetFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['image/', 'video/', 'audio/']
    if (!validTypes.some(t => file.type.startsWith(t))) {
      alert('Please upload an image, video, or audio file.')
      return
    }
    setAssetFileToUpload(file)
    setAssetInput(URL.createObjectURL(file))
    if (assetFileInputRef.current) assetFileInputRef.current.value = ''
  }

  function handleAssetPreviewFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file for the preview.')
      return
    }
    if (assetPreviewObjectUrl) URL.revokeObjectURL(assetPreviewObjectUrl)
    const objUrl = URL.createObjectURL(file)
    setAssetPreviewFile(file)
    setAssetPreviewObjectUrl(objUrl)
    if (assetPreviewFileInputRef.current) assetPreviewFileInputRef.current.value = ''
  }

  /* ── Status badge color helper ── */
  function statusBadgeColor(status: string): string {
    if (status === 'approved') return '#74f0a0'
    if (status === 'rejected') return '#ff8a4a'
    return '#ffd23f'
  }

  /* ── Certificate download handler ── */
  async function handleDownloadCertificate() {
    if (delivPct < 75) return
    
    setIsDownloadingPDF(true)
    try {
      const playerName = user?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) || character.player_name || character.character_key.toUpperCase()
      const characterKey = character.character_key
      const accent = character.accent_color || '#ffd23f'
      
      // Fetch latest certificate settings from database
      const certResponse = await fetch(`/api/workshops/${cohortId}/certificate-settings`)
      const latestCertSettings = certResponse.ok ? await certResponse.json() : certSettings
      
      // Build character sprite URI
      let characterSpriteUri = ''
      try {
        const { buildSpriteUri } = await import('@/components/workshops/journey/PixelSprite')
        characterSpriteUri = buildSpriteUri(
          characterKey,
          accent,
          {
            gear: (character as any).gear || 'none',
            outfit: (character as any).outfit || 'plain'
          }
        )
      } catch (e) {
        console.error('Failed to build sprite URI:', e)
      }

      // Build deliverables data
      const deliverables = days.slice(0, 3).map((day, idx) => {
        const submission = submissions.find((s: any) => s.workshop_day_id === day.id)
        const userTitle = submission?.title || (day as any).deliverable_title?.toUpperCase() || day.title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`
        return {
          title: userTitle.toUpperCase(),
          url: ''
        }
      })

      // Client-side PDF generation using html2canvas + jsPDF (same as VictoryScreen)
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ])
      const html2canvas = html2canvasModule.default
      const { jsPDF } = jsPDFModule

      // Import the shared buildClientCertHTML function
      const { buildClientCertHTML } = await import('@/components/workshops/journey/VictoryScreen')
      
      // Create a hidden container with the certificate HTML
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px'
      container.style.zIndex = '-1'
      container.innerHTML = buildClientCertHTML({
        playerName,
        characterKey,
        certOrg: latestCertSettings.certOrg || certSettings.certOrg,
        certFacilitator: latestCertSettings.certFacilitator || certSettings.certFacilitator,
        certFacTitle: latestCertSettings.certFacTitle || certSettings.certFacTitle,
        certSponsor: latestCertSettings.certSponsor || certSettings.certSponsor,
        certSponsorOrg: latestCertSettings.certSponsorOrg || certSettings.certSponsorOrg,
        certMessage: latestCertSettings.certMessage || certSettings.certMessage,
        deliverables,
        characterSpriteUri
      })
      document.body.appendChild(container)

      // Wait for fonts and images to load
      await document.fonts.ready
      const images = container.querySelectorAll('img')
      await Promise.all(Array.from(images).map(img => 
        new Promise<void>((resolve) => {
          if (img.complete) { resolve(); return }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      ))
      await new Promise(resolve => setTimeout(resolve, 300))

      const contentHeight = container.scrollHeight || container.offsetHeight || 1123
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f7f1e0',
        width: 794,
        height: contentHeight,
      })

      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = 210
      const pageHeight = 297
      const imgAspect = canvas.width / canvas.height
      
      let imgW = pageWidth
      let imgH = pageWidth / imgAspect
      
      if (imgH > pageHeight) {
        imgH = pageHeight
        imgW = pageHeight * imgAspect
      }
      
      const xOffset = (pageWidth - imgW) / 2
      pdf.addImage(imgData, 'PNG', xOffset, 0, imgW, imgH)
      pdf.save(`certificate-${playerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert('Failed to download certificate. Check browser console for details.')
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  /* ===== RENDER ===== */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Responsive styles for Portfolio Page */
        @media (max-width: 768px) {
          .portfolio-wrapper {
            padding: 12px 10px !important;
          }
          
          .portfolio-chia-header {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 14px !important;
          }
          
          .portfolio-chia-sprite {
            width: 80px !important;
            height: 100px !important;
          }
          
          .portfolio-chia-info {
            min-width: auto !important;
          }
          
          .portfolio-chia-title {
            font-size: 18px !important;
          }
          
          .portfolio-deliverables-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          
          .portfolio-deliverable-card {
            padding: 12px !important;
          }
          
          .portfolio-shelf-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          
          .portfolio-asset-preview {
            max-width: 100% !important;
            max-height: 200px !important;
          }
        }
        
        @media (max-width: 640px) {
          .portfolio-wrapper {
            padding: 10px 8px !important;
          }
          
          .portfolio-chia-header {
            padding: 12px !important;
            gap: 10px !important;
          }
          
          .portfolio-chia-sprite {
            width: 60px !important;
            height: 75px !important;
          }
          
          .portfolio-chia-title {
            font-size: 16px !important;
          }
          
          .portfolio-deliverables-grid {
            gap: 8px !important;
          }
          
          .portfolio-deliverable-card {
            padding: 10px !important;
          }
        }
      `}} />
    <div className="portfolio-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%', maxWidth: 1080, margin: '0 auto', padding: 'clamp(16px,3vw,30px) clamp(12px,3vw,24px)' }}>

      {/* ── Section A: Chia Guardian Header ── */}
      <div
        className="portfolio-chia-header"
        style={{
          border: '2px solid var(--ok,#74f0a0)',
          borderRadius: 12,
          padding: 'clamp(16px,2.5vw,24px)',
          background: 'linear-gradient(180deg,rgba(116,240,160,.08),var(--pn,#241542))',
          boxShadow: '0 0 26px rgba(116,240,160,.1)',
          display: 'flex',
          gap: 'clamp(14px,2vw,24px)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Chia sprite */}
        <div style={{ textAlign: 'center', flex: 'none' }}>
          <img 
            src={deskChiaUri} 
            alt="" 
            width={120} 
            height={150} 
            className="portfolio-chia-sprite"
            style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.4))' }} 
          />
        </div>
        {/* Right side info */}
        <div className="portfolio-chia-info" style={{ flex: 1, minWidth: 200 }}>
          <div
            className="font-pixel"
            style={{ fontSize: 12, color: 'var(--ok,#74f0a0)', letterSpacing: 1, marginBottom: 4 }}
          >
            ❀ MY CHIA GUARDIAN
          </div>
          <div
            className="font-pixel portfolio-chia-title"
            style={{ fontSize: 'clamp(20px,2.5vw,28px)', color: '#fff', marginBottom: 6 }}
          >
            {userRole === 'guest' ? engPct : chiaPct}% GROWN
          </div>
          <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>
            Stage: {stage}
          </div>

          {/* Stacked bar */}
          <div
            style={{
              height: 20,
              borderRadius: 20,
              background: '#1a0e2e',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {userRole !== 'guest' && (
            <div
              style={{
                width: `${delivPct}%`,
                height: '100%',
                background: '#74f0a0',
                transition: 'width .4s ease',
              }}
            />
            )}
            <div
              style={{
                width: `${engPct}%`,
                height: '100%',
                background: '#45d6ff',
                transition: 'width .4s ease',
              }}
            />
          </div>

          {/* Legend */}
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {userRole !== 'guest' && (
            <div style={{ fontSize: 18, color: '#74f0a0' }}>
              <span style={{ marginRight: 6 }}>■</span>
              Deliverables {delivPct}% / 75%
            </div>
            )}
            <div style={{ fontSize: 18, color: '#45d6ff' }}>
              <span style={{ marginRight: 6 }}>■</span>
              Engagement {engPct}% / 25%
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: My Deliverables (hidden for guests) ── */}
      {userRole !== 'guest' && (
      <div
        style={{
          border: '2px solid var(--gold,#ffd23f)',
          borderRadius: 12,
          background: 'rgba(255,210,63,.04)',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        <div
          className="font-pixel"
          style={{ fontSize: 14, color: 'var(--gold,#ffd23f)', marginBottom: 14 }}
        >
          ⛃ MY DELIVERABLES
        </div>

        <div
          className="portfolio-deliverables-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
          }}
        >
          {[1, 2, 3].map(dayNum => {
            const day = days.find(d => d.day_number === dayNum)
            const prog = day ? progressByDay[day.id] : null
            const status = prog?.deliverable_status || 'not_submitted'
            const pill = STATUS_PILL[status] || STATUS_PILL.not_submitted

            return (
              <div
                key={dayNum}
                className="portfolio-deliverable-card"
                style={{
                  border: '2px solid var(--ln,#3d2668)',
                  borderRadius: 8,
                  padding: 14,
                  background: 'var(--pn,#241542)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {/* Small Chia icon */}
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={deskChiaUri} 
                    alt="" 
                    width={40} 
                    height={50} 
                    style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.4))' }} 
                  />
                </div>
                <div
                  className="font-pixel"
                  style={{ fontSize: 12, color: 'var(--gold,#ffd23f)' }}
                >
                  DAY 0{dayNum}
                </div>
                <div style={{ fontSize: 16, color: '#fff', textAlign: 'center' }}>
                  {day?.title || `Day ${dayNum}`}
                </div>
                <div
                  className="font-pixel"
                  style={{
                    fontSize: 10,
                    color: pill.color,
                    background: `${pill.color}18`,
                    padding: '4px 10px',
                    borderRadius: 20,
                    marginTop: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pill.label}
                </div>

                <div style={{ width: '100%', borderTop: '1px dashed var(--ln,#3d2668)', paddingTop: 9, marginTop: 2 }}>
                  <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 6 }}>
                    ✦ DELIVERABLE
                  </div>
                  {(() => {
                    // Get all submissions for this day, pick the latest one with a URL
                    const allDaySubs = submissions.filter((s: any) => s.workshop_day_id === day?.id);
                    // Try to find one with a URL first
                    const subWithUrl = allDaySubs.find((s: any) => s.submission_text || s.external_video_url || s.file_storage_path);
                    const submission = subWithUrl || allDaySubs[0] || null;
                    
                    let rawLink = '';
                    if (submission) {
                      rawLink = submission.external_video_url || submission.submission_text || submission.file_storage_path || '';
                      rawLink = rawLink.replace(/^\[SHOWCASE_REQUESTED\]\s*/, '').trim();
                    }
                    
                    if (rawLink && rawLink.length > 5) {
                      return (
                        <div>
                          <DeliverableMediaPreview
                            url={rawLink}
                            variant="thumbnail"
                            theme="dark"
                            showPreviewButton={true}
                            maxThumbnailSize={40}
                          />
                          {submission?.title && submission.title !== rawLink && (
                            <div style={{ fontSize: 12, color: 'var(--mu,#a493c9)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {submission.title}
                            </div>
                          )}
                        </div>
                      );
                    }
                    // Show title or placeholder
                    if (submission?.title) {
                      return (
                        <div style={{ fontSize: 13, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {submission.title}
                        </div>
                      );
                    }
                    return (
                      <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', opacity: 0.7 }}>
                        — no link banked yet —
                      </div>
                    );
                  })()}
                </div>

                {prog?.review_note && (
                  <div style={{ width: '100%', borderTop: '1px dashed var(--ln,#3d2668)', paddingTop: 9, marginTop: 9 }}>
                    <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 6 }}>
                      ✦ INSTRUCTOR NOTE
                    </div>
                    <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordWrap: 'break-word' }}>
                      {prog.review_note}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      )}

      {/* ── Section C: My Engagement ── */}
      <div
        style={{
          border: '2px solid var(--ok,#74f0a0)',
          borderRadius: 12,
          background: 'linear-gradient(180deg,rgba(116,240,160,.05),var(--pn,#241542))',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div
            className="font-pixel"
            style={{ fontSize: 14, color: 'var(--ok,#74f0a0)' }}
          >
            ✦ MY ENGAGEMENT
          </div>
          <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)' }}>
            {approvedCount} approved · {pendingCount} pending · {engPct}%/25%
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)', marginTop: 6 }}>
          Add items to grow your Chia Guardian. Bookmark +1% · Note +1% · Prompt +3% · Asset +2%
        </div>

        {/* Earn % info note */}
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(164,147,201,.35)', borderRadius: 8, fontSize: 14, color: 'var(--mu,#a493c9)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--ok,#74f0a0)', fontWeight: 700, marginRight: 6 }}>✦ Points after admin approves:</span>
          <span style={{ color: 'var(--tx,#efe6ff)' }}>📌 Bookmark <b>+1%</b></span> &nbsp;&middot;&nbsp;
          <span style={{ color: 'var(--tx,#efe6ff)' }}>📝 Note <b>+1%</b></span> &nbsp;&middot;&nbsp;
          <span style={{ color: 'var(--tx,#efe6ff)' }}>🖼 Saved asset <b>+2%</b></span> &nbsp;&middot;&nbsp;
          <span style={{ color: 'var(--tx,#efe6ff)' }}>🌿 Suggested resource <b>+2%</b></span> &nbsp;&middot;&nbsp;
          <span style={{ color: 'var(--tx,#efe6ff)' }}>💬 Prompt <b>+3%</b></span> &nbsp;&middot;&nbsp;
          <span style={{ color: 'var(--tx,#efe6ff)' }}>🌟 Asset in showcase <b>+3%</b> <span style={{ fontSize: 12, color: 'var(--mu,#a493c9)' }}>(2 asset + 1 showcase)</span></span> &nbsp;&middot;&nbsp;
          <span style={{ color: 'var(--tx,#efe6ff)' }}>🏆 Mini deliverable <b>+4%</b></span>
        </div>

        {/* Engagement progress bar */}
        <div
          style={{
            height: 12,
            borderRadius: 20,
            background: '#1a0e2e',
            marginTop: 12,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min((engPct / 25) * 100, 100)}%`,
              height: '100%',
              borderRadius: 20,
              background: 'linear-gradient(90deg,var(--ok,#74f0a0),var(--s,#45d6ff))',
              transition: 'width .4s ease',
            }}
          />
        </div>

        {/* ── Section C.1: Shelf Columns ── */}
        <div
          className="portfolio-shelf-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {SHELF_COLS.map(col => {
            const items = engByKind[col.kind] || []
            const st = inputState[col.kind]
            
            // Helper to determine if an item is a read-only application resource
            const isAppResource = (source: string | null | undefined) => {
              if (!source) return false;
              const s = source.toLowerCase();
              return ['curriculum', 'library', 'workforce', 'environmental', 'student showcase', 'quest board'].includes(s) 
                || s.includes('steward library') 
                || s.startsWith('day ') 
                || s.includes('instructional') 
                || s.includes('session');
            };
            return (
              <div
                key={col.kind}
                style={{
                  border: '2px solid var(--ln,#3d2668)',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 10px', borderBottom: '2px solid var(--ln,#3d2668)' }}>
                  <span className="font-pixel" style={{ fontSize: 16, color: col.color, flex: 'none' }}>{col.icon}</span>
                  <div className="font-pixel" style={{ flex: 1, minWidth: 0, fontSize: col.label.length > 12 ? 10 : 12, color: col.color, letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {col.label}
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--mu,#a493c9)' }}>
                    {items.length}
                  </span>
                  <button
                    onClick={() => {
                      if (col.kind === 'note') {
                        setIsNoteMiniDeliverable(false)
                        setShowNoteEditor(true)
                      } else if (col.kind === 'prompt') {
                        setIsPromptMiniDeliverable(false)
                        setShowPromptEditor(true)
                      } else if (col.kind === 'mini_deliverable') {
                        setIsNoteMiniDeliverable(true)
                        setShowNoteEditor(true)
                      } else if (col.kind === 'bookmark') {
                        setShowBookmarkEditor(true)
                      }
                    }}
                    title={`Add ${col.label.toLowerCase()}`}
                    className="font-pixel"
                    style={{
                      flex: 'none',
                      background: 'rgba(0,0,0,.2)',
                      border: `1px solid ${col.color}`,
                      borderRadius: 4,
                      color: col.color,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      fontSize: 10,
                      marginLeft: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    + ADD
                  </button>
                </div>

                {/* Scrollable items list */}
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 240, overflowY: 'auto' }}>
                  {items.length === 0 && (
                    <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', textAlign: 'center', padding: '9px 0' }}>
                      No {col.label.toLowerCase()} yet
                    </div>
                  )}
                  {items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--ln,#3d2668)',
                        borderRadius: 7,
                        background: 'rgba(0,0,0,.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 9px' }}>
                        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                          <div
                            style={{
                              fontSize: 18,
                              color: 'var(--tx,#efe6ff)',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.kind === 'mini_deliverable' && (
                              <span style={{ display: 'inline-block', padding: '2px 6px', background: 'var(--gold,#ffd23f)', color: '#000', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginRight: '6px', verticalAlign: 'middle', textTransform: 'uppercase' }}>
                                Mini Deliverable
                              </span>
                            )}
                            {(() => {
                              let displayTitle = item.title;
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
                          <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginTop: 4 }}>
                            {item.source?.startsWith('workshop:') ? 'Workshop Portfolio' : item.source || 'My Shelf'} · {item.status === 'approved' ? `✓ +${ENGPCT[item.kind] || 1}%` : item.status === 'rejected' ? <span style={{ color: 'var(--er,#ff5f5f)' }}>✕ rejected</span> : '🕒 pending'}
                          </div>
                        </div>
                        {item.review_note && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === item.id ? null : item.id); }}
                            title={expandedNoteId === item.id ? "Hide admin note" : "Show admin note"}
                            className="font-pixel"
                            style={{
                              flex: 'none',
                              background: expandedNoteId === item.id ? 'var(--gold,#ffd23f)' : 'rgba(255,210,63,.2)',
                              border: '1px solid var(--gold,#ffd23f)',
                              color: expandedNoteId === item.id ? '#12081e' : 'var(--gold,#ffd23f)',
                              fontSize: 9,
                              cursor: 'pointer',
                              lineHeight: 1,
                              padding: '5px 8px',
                              borderRadius: 3,
                              letterSpacing: 0.5,
                            }}
                          >
                            {expandedNoteId === item.id ? '✕ NOTE' : '📝 NOTE'}
                          </button>
                        )}
                        <button
                          onClick={() => setViewingId(item.id)}
                          title="Open this item"
                          style={{
                            flex: 'none',
                            background: 'none',
                            border: 'none',
                            color: 'var(--s,#45d6ff)',
                            fontSize: 14,
                            cursor: 'pointer',
                            lineHeight: 1,
                          }}
                        >
                          ⤢
                        </button>
                        {!isAppResource(item.source) && (
                          <button
                            onClick={() => {
                              console.log('[Portfolio] Edit button clicked for item:', item.id)
                              console.log('[Portfolio] Item data:', item)
                              handleStartEdit(item.id)
                            }}
                            title="Edit"
                            style={{
                              flex: 'none',
                              background: 'none',
                              border: 'none',
                              color: 'var(--gold,#ffd23f)',
                              fontSize: 13,
                              cursor: 'pointer',
                              lineHeight: 1,
                            }}
                          >
                            ✎
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveEngagement(item.id)}
                          title="Remove"
                          style={{
                            flex: 'none',
                            background: 'none',
                            border: 'none',
                            color: 'var(--mu,#a493c9)',
                            fontSize: 14,
                            cursor: 'pointer',
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {expandedNoteId === item.id && item.review_note && (
                        <div style={{ padding: '8px 9px', borderTop: '1px dashed var(--ln,#3d2668)', background: 'rgba(255,210,63,.08)' }}>
                          <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)', letterSpacing: 0.5, marginBottom: 5 }}>
                            ADMIN NOTE
                          </div>
                          <div style={{ fontSize: 15, color: 'var(--tx,#efe6ff)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {item.review_note}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Section C.2: Saved Assets ── */}
        <div
          style={{
            border: '2px solid var(--ok,#74f0a0)',
            borderRadius: 10,
            background: 'linear-gradient(180deg,rgba(116,240,160,.07),rgba(0,0,0,.15))',
            padding: 'clamp(12px,2vw,18px)',
            marginTop: 16,
          }}
        >
          <div
            className="font-pixel"
            style={{ fontSize: 12, color: 'var(--ok,#74f0a0)', marginBottom: 6 }}
          >
            ◉ SAVED ASSETS
          </div>
          <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>
            Paste a link to an AI-generated image, audio clip, or video to save it here.
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {assetInput.startsWith('blob:') ? (
                <div style={{
                  flex: 1,
                  minWidth: 200,
                  background: '#1a0e2e',
                  border: '1px solid var(--ln,#3d2668)',
                  borderRadius: 6,
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  {assetFileToUpload?.type.startsWith('image/') ? (
                    <img
                      src={assetInput}
                      alt="Upload preview"
                      style={{ height: 28, width: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ln,#3d2668)' }}
                    />
                  ) : assetFileToUpload?.type.startsWith('video/') ? (
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🎬</span>
                  ) : (
                    <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🎵</span>
                  )}
                  <div style={{ flex: 1, color: 'var(--tx,#efe6ff)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {assetFileToUpload?.name || 'Uploaded File'}
                  </div>
                  <button
                    onClick={() => { setAssetInput(''); setAssetFileToUpload(null) }}
                    style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', padding: 4, fontSize: 14 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={assetInput}
                  onChange={e => setAssetInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddAsset() }}
                  placeholder="Paste link…"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    background: '#1a0e2e',
                    border: '1px solid var(--ln,#3d2668)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    color: 'var(--tx,#efe6ff)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              )}
              <input type="file" accept="image/*,video/*,audio/*" hidden ref={assetFileInputRef} onChange={handleAssetFileChange} />
              <input type="file" accept="image/*" hidden ref={assetPreviewFileInputRef} onChange={handleAssetPreviewFileChange} />
              <button
                onClick={() => assetFileInputRef.current?.click()}
                disabled={isUploadingAsset}
                className="font-pixel"
                style={{
                  background: 'transparent',
                  border: '2px solid var(--s,#45d6ff)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: 'var(--s,#45d6ff)',
                  fontSize: 11,
                  cursor: isUploadingAsset ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                ↑ UPLOAD
              </button>
              <button
                onClick={handleAddAsset}
                disabled={isUploadingAsset || (!assetInput.trim() && !assetFileToUpload)}
                className="font-pixel"
                style={{
                  background: 'var(--ok,#74f0a0)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  color: '#12081e',
                  fontSize: 9,
                  cursor: (isUploadingAsset || (!assetInput.trim() && !assetFileToUpload)) ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  opacity: (isUploadingAsset || (!assetInput.trim() && !assetFileToUpload)) ? 0.5 : 1,
                }}
              >
                {isUploadingAsset ? '⏳' : '＋ SAVE'}
              </button>
            </div>
            {/* Showcase checkbox */}
            <button
              onClick={() => setAssetShowcaseSubmit(!assetShowcaseSubmit)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: 'rgba(0,0,0,.2)',
                border: `2px solid ${assetShowcaseSubmit ? 'var(--pk,#ff5fd2)' : 'var(--ln,#3d2668)'}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--tx,#efe6ff)',
                width: 'fit-content',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid var(--pk,#ff5fd2)',
                  borderRadius: 3,
                  background: assetShowcaseSubmit ? 'var(--pk,#ff5fd2)' : 'transparent',
                  color: assetShowcaseSubmit ? '#12081e' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  flex: 'none',
                }}
              >
                {assetShowcaseSubmit ? '✓' : ''}
              </span>
              <span style={{ lineHeight: 1.3 }}>
                Submit to the curated <b>Student Showcase</b>
              </span>
            </button>
            <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', lineHeight: 1.3 }}>
              Student assets are reviewed by faculty before appearing in your public portfolio or the showcase.{' '}
              <span style={{ color: 'var(--sy,#ffd23f)' }}>* Submitting to the Showcase grants an extra <b>+1% engagement</b> upon approval (3% total).</span>
            </div>
            {/* Preview image picker — shown only when URL is pasted and detected as a non-media link */}
            {assetInput.trim() && !assetInput.startsWith('blob:') && detectMediaType(assetInput) === 'link' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => assetPreviewFileInputRef.current?.click()}
                  disabled={isUploadingAsset}
                  className="font-pixel"
                  style={{
                    background: 'transparent',
                    border: '2px solid var(--pk,#ff5fd2)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: 'var(--pk,#ff5fd2)',
                    fontSize: 9,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  📷 + ADD PREVIEW IMAGE
                </button>
                {assetPreviewObjectUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img
                      src={assetPreviewObjectUrl}
                      alt="Preview"
                      style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--pk,#ff5fd2)' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--mu,#a493c9)', display: 'inline-block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assetPreviewFile?.name}</span>
                    <button
                      onClick={() => { setAssetPreviewFile(null); if (assetPreviewObjectUrl) URL.revokeObjectURL(assetPreviewObjectUrl); setAssetPreviewObjectUrl(null) }}
                      style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 13, padding: 2 }}
                    >✕</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Asset cards grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
              gap: 11,
            }}
          >
            {(engByKind.generation || []).length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', padding: 12 }}>
                No saved assets yet
              </div>
            )}
            {(engByKind.generation || []).map(asset => {
              const grad = ASSET_GRADIENTS.generation
              // Derive a simple type tag from the URL or default
              const typeTag = asset.url?.match(/\.(mp4|webm|mov)/i)
                ? 'VIDEO'
                : asset.url?.match(/\.(mp3|wav|ogg)/i)
                  ? 'AUDIO'
                  : 'IMAGE'

              return (
                <div
                  key={asset.id}
                  style={{
                    border: '2px solid var(--ln,#3d2668)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'var(--pn,#241542)',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewingId(asset.id)}
                  title="Click to view asset"
                >
                  {/* Thumbnail - show media preview based on type */}
                  {asset.url && isImageUrl(asset.url) ? (
                    <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,.3)' }}>
                      <img
                        src={asset.url}
                        alt={asset.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.style.background = grad; }}
                      />
                    </div>
                  ) : asset.url && (asset.url.includes('youtube.com') || asset.url.includes('youtu.be')) ? (
                    <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: '#000' }}>
                      <img
                        src={`https://img.youtube.com/vi/${asset.url.includes('youtu.be/') ? asset.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(asset.url.split('?')[1] || '').get('v')}/mqdefault.jpg`}
                        alt={asset.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.style.background = grad; }}
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, color: '#fff', marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                    </div>
                  ) : asset.url && asset.url.match(/\.(mp3|wav|ogg|aac|flac)/i) ? (
                    <div style={{ height: 70, background: 'linear-gradient(135deg, #1a0e2e, #3d2668)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 28 }}>🎵</span>
                    </div>
                  ) : asset.url && asset.url.match(/\.(mp4|webm|mov|avi)/i) ? (
                    <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: '#000' }}>
                      <video
                        src={asset.url}
                        preload="metadata"
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 11, color: '#fff', marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                    </div>
                  ) : (() => {
                    // Try to get previewUrl from content JSON
                    let previewUrl: string | null = null;
                    try { const d = JSON.parse(asset.content || '{}'); previewUrl = d.previewUrl || null; } catch {}
                    return previewUrl ? (
                      <div style={{ height: 70, overflow: 'hidden', position: 'relative', background: 'rgba(0,0,0,.3)' }}>
                        <img
                          src={previewUrl}
                          alt={asset.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.style.background = grad; }}
                        />
                      </div>
                    ) : (
                      <div style={{ height: 70, background: grad }} />
                    );
                  })()}
                  {/* Type tag badge */}
                  <span
                    className="font-pixel"
                    style={{
                      position: 'absolute',
                      top: 52,
                      right: 6,
                      fontSize: 7,
                      color: '#12081e',
                      background: 'var(--ok,#74f0a0)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {typeTag}
                  </span>
                  {/* Label + status badge + remove */}
                  <div style={{ padding: '8px 8px 6px' }}>
                    <div
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        color: 'var(--tx,#efe6ff)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {asset.title}
                    </div>
                    
                    {/* Status badge showing approval status and percentage */}
                    <div style={{ marginTop: 7 }}>
                      <span
                        className="font-pixel"
                        style={{
                          fontSize: 6,
                          color: asset.status === 'approved' ? '#12081e' : '#ffd23f',
                          background: asset.status === 'approved' ? '#74f0a0' : 'transparent',
                          border: `1px solid ${asset.status === 'approved' ? '#74f0a0' : '#ffd23f'}`,
                          borderRadius: 20,
                          padding: '3px 7px',
                        }}
                      >
                        {asset.status === 'approved' ? '+2% ✓' : 'PENDING'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveEngagement(asset.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--mu,#a493c9)',
                        fontSize: 12,
                        cursor: 'pointer',
                        padding: '2px 0',
                        marginTop: 4,
                        lineHeight: 1,
                      }}
                      aria-label="Remove asset"
                    >
                      ✕ remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Modals for Viewing and Editing */}
      {viewingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingId(null)}>
          <div style={{ background: '#12081e', border: '2px solid var(--s,#45d6ff)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="font-pixel" style={{ fontSize: 14, color: 'var(--s,#45d6ff)' }}>
                VIEW {viewingItem.kind.toUpperCase()}
              </div>
              <button onClick={() => setViewingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>
            
            <div style={{ fontSize: 22, color: 'var(--tx,#efe6ff)', marginBottom: 14, wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 600 }}>{viewingItem.title}</div>
            
            {/* Status */}
            <div style={{ fontSize: 17, color: viewingItem.status === 'approved' ? 'var(--ok,#74f0a0)' : 'var(--gold,#ffd23f)', marginBottom: 18 }}>
              {viewingItem.status === 'approved' ? '✓ Approved · counts toward your Chia' : viewingItem.status === 'pending' ? '◔ Pending instructor approval' : viewingItem.status}
            </div>

            {/* Review Note */}
            {viewingItem.review_note && (
              <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 6, background: 'rgba(255,210,63,.12)', borderLeft: '4px solid var(--gold,#ffd23f)' }}>
                <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>
                  ▤ TEACHER NOTE:
                </div>
                <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.5 }}>
                  {viewingItem.review_note}
                </div>
              </div>
            )}
            
            {/* For generation/assets and bookmarks: show preview if URL is media */}
            {viewingItem.url && (
              <div style={{ marginBottom: 18 }}>
                {/* Only show image preview for: uploaded files (supabase), actual image URLs, or generation assets */}
                {(isImageUrl(viewingItem.url) && (viewingItem.url.includes('supabase.co/storage') || viewingItem.kind === 'generation' || viewingItem.url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i))) ? (
                  <img 
                    src={viewingItem.url} 
                    alt={viewingItem.title} 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      maxHeight: 300,
                      objectFit: 'contain', 
                      borderRadius: 8, 
                      border: '2px solid var(--ln,#3d2668)',
                      marginBottom: 10,
                      background: 'rgba(0,0,0,.3)'
                    }} 
                  />
                ) : viewingItem.url.match(/\.(mp4|webm|mov)/i) || (viewingItem.url.includes('supabase') && viewingItem.url.match(/\.(mp4|webm|mov)/i)) ? (
                  <video 
                    src={viewingItem.url} 
                    controls 
                    style={{ 
                      display: 'block', 
                      width: '100%', 
                      maxHeight: 280, 
                      borderRadius: 8, 
                      border: '2px solid var(--ln,#3d2668)',
                      marginBottom: 10 
                    }} 
                  />
                ) : viewingItem.url.match(/\.(mp3|wav|ogg|aac|flac|m4a)/i) ? (
                  <audio 
                    src={viewingItem.url} 
                    controls 
                    style={{ width: '100%', marginBottom: 10 }} 
                  />
                ) : (viewingItem.url.includes('youtube.com') || viewingItem.url.includes('youtu.be')) ? (
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid var(--ln,#3d2668)', marginBottom: 10 }}>
                    <img 
                      src={`https://img.youtube.com/vi/${viewingItem.url.includes('youtu.be/') ? viewingItem.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(viewingItem.url.split('?')[1] || '').get('v')}/mqdefault.jpg`}
                      alt="YouTube"
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 22, color: '#fff', marginLeft: 4 }}>▶</span>
                      </div>
                    </div>
                  </div>
                ) : (viewingItem.kind === 'generation' || viewingItem.kind === 'bookmark') ? (() => {
                  let previewUrl: string | null = null;
                  try { const d = JSON.parse(viewingItem.content || '{}'); previewUrl = d.previewUrl || null; } catch {}
                  
                  return previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt={viewingItem.title} 
                      style={{ 
                        display: 'block', 
                        width: '100%', 
                        maxHeight: 300,
                        objectFit: 'contain', 
                        borderRadius: 8, 
                        border: '2px solid var(--ln,#3d2668)',
                        marginBottom: 10,
                        background: 'rgba(0,0,0,.3)'
                      }} 
                    />
                  ) : viewingItem.kind === 'generation' ? (
                    <div style={{ 
                      width: '100%', 
                      height: 120, 
                      background: 'linear-gradient(135deg,#45d6ff 0%,#74f0a0 100%)', 
                      borderRadius: 8, 
                      border: '2px solid var(--ln,#3d2668)',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="font-pixel" style={{ fontSize: 13, color: '#12081e' }}>ASSET</span>
                    </div>
                  ) : null;
                })() : null}
                {viewingItem.kind === 'generation' && (
                  <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)' }}>
                    ◉ {viewingItem.url.match(/\.(mp4|webm|mov)/i) ? 'VIDEO' : viewingItem.url.match(/\.(mp3|wav|ogg)/i) ? 'AUDIO' : 'IMAGE'} asset · generated in your workshop tools
                  </div>
                )}
              </div>
            )}
            
            {/* For notes and prompts: show content */}
            {viewingItem.content && viewingItem.content !== viewingItem.title && viewingItem.kind !== 'generation' && (() => {
              const parsedContent = parseNoteContent(viewingItem.content);
              if (parsedContent.version === 2) {
                return (
                  <div 
                    style={{ fontSize: 17, color: 'var(--mu,#a493c9)', marginBottom: 18, lineHeight: 1.5, maxHeight: '45vh', overflowY: 'auto', paddingRight: 8 }} 
                    dangerouslySetInnerHTML={{ __html: parsedContent.html }}
                  />
                );
              } else {
                const displayText = parsedContent.text || viewingItem.content;
                return (
                  <div style={{ fontSize: 17, color: 'var(--mu,#a493c9)', marginBottom: 18, whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: '45vh', overflowY: 'auto', paddingRight: 8 }}>
                    {displayText}
                  </div>
                );
              }
            })()}
            
            {/* For bookmarks or any item with URL: show clickable link (but not for uploaded files) */}
            {((viewingItem.kind === 'bookmark' && viewingItem.title.startsWith('http')) || (viewingItem.url && !viewingItem.url.includes('supabase.co/storage'))) && (
              <a 
                href={viewingItem.url || viewingItem.title} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  textDecoration: 'none', 
                  border: '2px solid var(--s,#45d6ff)', 
                  borderRadius: 8, 
                  padding: '14px 16px', 
                  background: 'rgba(255,255,255,0.03)',
                  marginTop: 18
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, color: 'var(--tx,#efe6ff)', wordBreak: 'break-all', overflowWrap: 'break-word', lineHeight: 1.4 }}>
                    {viewingItem.url || viewingItem.title}
                  </div>
                </div>
                <span className="font-pixel" style={{ fontSize: 12, color: '#12081e', background: 'var(--s,#45d6ff)', borderRadius: 5, padding: '10px 14px', flexShrink: 0 }}>
                  OPEN ↗
                </span>
              </a>
            )}
            
            <div style={{ marginTop: 26, fontSize: 15, color: 'var(--mu,#a493c9)' }}>
              Source: {viewingItem.source?.startsWith('workshop:') ? 'Workshop Portfolio' : viewingItem.source || 'My Shelf'} · Status: {viewingItem.status}
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingId(null)}>
          <style dangerouslySetInnerHTML={{ __html: `
            .portfolio-edit-modal .border.rounded-md.shadow-sm.bg-white {
              background: rgba(0,0,0,.4) !important;
              border-color: var(--ln,#3d2668) !important;
            }
            .portfolio-edit-modal .bg-gray-50 {
              background: rgba(0,0,0,.3) !important;
            }
            .portfolio-edit-modal .text-gray-700 {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-edit-modal .hover\\:bg-gray-200:hover {
              background: rgba(255,210,63,.2) !important;
            }
            .portfolio-edit-modal .bg-gray-200 {
              background: var(--gold,#ffd23f) !important;
              color: #12081e !important;
            }
            .portfolio-edit-modal .bg-white {
              background: rgba(0,0,0,.2) !important;
            }
            .portfolio-edit-modal .prose {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-edit-modal .prose h1,
            .portfolio-edit-modal .prose h2,
            .portfolio-edit-modal .prose h3 {
              color: var(--gold,#ffd23f) !important;
            }
            .portfolio-edit-modal .prose a {
              color: var(--s,#45d6ff) !important;
            }
            .portfolio-edit-modal .prose strong {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-edit-modal .bg-gray-300 {
              background: var(--ln,#3d2668) !important;
            }
          `}} />
          <div style={{ background: '#12081e', border: '2px solid var(--gold,#ffd23f)', borderRadius: 12, padding: 28, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="font-pixel" style={{ fontSize: 14, color: 'var(--gold,#ffd23f)' }}>
                EDIT {editingItem.kind.toUpperCase()}
              </div>
              <button type="button" onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
            </div>
            
            <label style={{ display: 'block', marginBottom: 18 }}>
              <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>TITLE</div>
              <input 
                value={editDraft.title}
                onChange={e => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '2px solid var(--ln,#3d2668)', color: 'var(--tx,#efe6ff)', padding: '12px 14px', borderRadius: 8, fontSize: 17, outline: 'none' }}
              />
            </label>
            
            {editingItem.kind === 'bookmark' && editingItem.url && (
              <div style={{ marginBottom: 18 }}>
                <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>
                  {editDraft.url?.includes('supabase.co/storage') ? 'UPLOADED FILE' : 'URL'}
                </div>
                
                {editDraft.url?.includes('supabase.co/storage') ? (
                  <>
                    {/* Show image preview for uploaded files */}
                    <div style={{ marginBottom: 12 }}>
                      <img 
                        src={editDraft.url} 
                        alt="Uploaded file" 
                        style={{ 
                          width: '100%', 
                          maxHeight: 200, 
                          objectFit: 'contain', 
                          borderRadius: 8, 
                          border: '2px solid var(--ln,#3d2668)', 
                          background: 'rgba(0,0,0,.3)' 
                        }} 
                      />
                    </div>
                    
                    {/* Option to change file */}
                    <input type="file" accept="image/*,video/*,audio/*" hidden ref={bookmarkFileInputRef} onChange={handleBookmarkFileChange} />
                    <button
                      type="button"
                      onClick={() => bookmarkFileInputRef.current?.click()}
                      disabled={isUploadingBookmark}
                      className="font-pixel"
                      style={{
                        width: '100%',
                        fontSize: 11,
                        color: 'var(--s,#45d6ff)',
                        background: 'rgba(69,214,255,.1)',
                        border: '2px dashed var(--s,#45d6ff)',
                        borderRadius: 8,
                        padding: '12px',
                        cursor: isUploadingBookmark ? 'wait' : 'pointer',
                        opacity: isUploadingBookmark ? 0.5 : 1,
                      }}
                    >
                      {isUploadingBookmark ? 'UPLOADING...' : bookmarkFileToUpload ? `✓ NEW FILE SELECTED: ${bookmarkFileToUpload.name}` : '↑ CLICK TO CHANGE FILE'}
                    </button>
                  </>
                ) : (
                  <input 
                    value={editDraft.url}
                    onChange={e => setEditDraft(prev => ({ ...prev, url: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '2px solid var(--ln,#3d2668)', color: 'var(--tx,#efe6ff)', padding: '12px 14px', borderRadius: 8, fontSize: 17, outline: 'none' }}
                  />
                )}
              </div>
            )}

            {(editingItem.kind !== 'bookmark' || editingItem.content) && (
              <div style={{ marginBottom: 24 }}>
                <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>
                  {editingItem.kind === 'bookmark' ? 'DESCRIPTION / NOTES (OPTIONAL)' : 'CONTENT'}
                </div>
                <div className="portfolio-edit-modal" style={{ border: '2px solid var(--ln,#3d2668)', borderRadius: 8, overflow: 'hidden' }}>
                  <RichTextEditor 
                    content={editDraft.content}
                    onChange={(html) => setEditDraft(prev => ({ ...prev, content: html }))}
                    onUpload={async (formData) => {
                      const res = await uploadCreationImage(formData);
                      return { publicUrl: res, type: 'image' };
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 14 }}>
              <button 
                type="button" 
                onClick={() => {
                  console.log('[Portfolio Modal] CANCEL button clicked')
                  setEditingId(null)
                }} 
                style={{ background: 'transparent', border: '2px solid var(--ln,#3d2668)', color: 'var(--mu,#a493c9)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={(e) => {
                  console.log('[Portfolio Modal] SAVE CHANGES button clicked')
                  console.log('[Portfolio Modal] Button event:', e)
                  console.log('[Portfolio Modal] editingId at click time:', editingId)
                  console.log('[Portfolio Modal] editDraft at click time:', editDraft)
                  handleSaveEdit(e)
                }} 
                style={{ background: 'var(--gold,#ffd23f)', border: 'none', color: '#12081e', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }} 
                className="font-pixel"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Section D: Your Pathway Answers ── */}
      <div
        style={{
          border: '2px solid var(--gold,#ffd23f)',
          borderRadius: 12,
          background: 'rgba(255,210,63,.04)',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div className="font-pixel" style={{ fontSize: 11, color: 'var(--gold,#ffd23f)' }}>
            ⛰ YOUR PATHWAY ANSWERS
          </div>
          <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>{workforcePicks.length}</span>
          <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>from Workforce Pathways</span>
        </div>

        {loadingWorkforcePicks ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu,#a493c9)' }}>Loading your pathway answers...</div>
        ) : workforcePicks.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--mu,#a493c9)', background: 'rgba(0,0,0,.2)', border: '2px dashed var(--ln,#3d2668)', borderRadius: 12 }}>
            No pathway answers yet. Complete your journey in{' '}
            <Link href="/hub/workforce-pathways" style={{ color: 'var(--s,#45d6ff)', textDecoration: 'underline' }}>Workforce Pathways</Link>!
          </div>
        ) : (
          <div>
            {PATHWAYS.map((pathway: any) => {
              const pathwayPicks = workforcePicks.filter((p: any) => p.pathway_id === pathway.id)
              if (pathwayPicks.length === 0) return null

              const pathwayColor = pathway.id === 'creator' ? '#ff6a2e' : '#43e97b'
              const totalStops = pathway.stops?.length || 0
              const isComplete = pathwayPicks.length >= totalStops && totalStops > 0
              const isExpanded = expandedPathwayCard === pathway.id
              const cardId = `portfolio-pathway-card-${pathway.id}`

              // Build the class label like the arcade summit
              const klassName = pathway.id === 'creator' ? 'CONTENT CREATOR' : 'ENVIRO STEWARD'

              const STEP_COLORS = ['#ffdd2e','#ff6a2e','#ff2e8f','#a855f7','#45d4ff','#12f0c0','#43e97b']

              return (
                <div key={pathway.id} style={{ marginBottom: 20 }}>
                  {/* Pathway header bar with label + card controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 14px', background: `${pathwayColor}15`, borderLeft: `4px solid ${pathwayColor}`, borderRadius: '0 8px 8px 0', flexWrap: 'wrap' }}>
                    <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 1, color: pathwayColor, fontWeight: 700 }}>{pathway.name.toUpperCase()}</span>
                    <span style={{ fontSize: 12, color: 'var(--mu,#a493c9)' }}>· {pathwayPicks.length}/{totalStops} answers</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                      {isComplete && (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpandedPathwayCard(isExpanded ? null : pathway.id)}
                            style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', padding: '6px 12px', background: isExpanded ? '#1c1526' : '#21282E', color: pathwayColor, border: `2px solid ${pathwayColor}`, borderRadius: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 8, letterSpacing: '.06em', fontWeight: 700 }}
                          >
                            {isExpanded ? '✕ HIDE CARD' : '🎮 VIEW PATHWAY CARD'}
                          </button>
                          {isExpanded && (
                            <PathwayCardDownload
                              cardElementId={cardId}
                              fileName={`${pathway.id}-pathway-card`}
                              accentColor={pathwayColor}
                              size="sm"
                              fontFamily="'Press Start 2P', monospace"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arcade-style Pathway Card (collapsed by default, shown when complete + toggled) */}
                  {isComplete && isExpanded && (
                    <div
                      id={cardId}
                      className="run-card"
                      style={{
                        position: 'relative',
                        marginBottom: 16,
                        maxWidth: 770,
                        background: '#f2f6ff',
                        border: '5px solid #1c1526',
                        boxShadow: '8px 8px 0 rgba(18,12,26,.42)',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      {/* RUN COMPLETE stamp */}
                      <div style={{ position: 'absolute', top: 78, right: 16, zIndex: 3, padding: '8px 13px', background: '#ff2e8f', color: '#fff', border: '4px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: 11, letterSpacing: '.5px', transform: 'rotate(-14deg)', boxShadow: '3px 3px 0 rgba(18,12,26,.4)' }}>RUN COMPLETE</div>

                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 18px', background: pathwayColor, borderBottom: '5px solid #1c1526' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 15, color: '#10285e', textShadow: '2px 2px 0 rgba(255,255,255,.35)', lineHeight: 1.4 }}>{klassName}</div>
                          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#10285e', opacity: .72, marginTop: 8, lineHeight: 1.6 }}>{pathway.name.toUpperCase()} · PATHWAY CARD</div>
                        </div>
                        <span style={{ width: 46, height: 46, flex: '0 0 auto', background: '#10285e', color: pathwayColor, border: '3px solid #1c1526', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Press Start 2P', monospace", fontSize: 15 }}>{pathwayPicks.length}</span>
                      </div>

                      {/* Card Body - Picks Grid */}
                      <div style={{ padding: '20px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {pathway.stops.map((stop: any, idx: number) => {
                            const pick = pathwayPicks.find((p: any) => p.stop_id === stop.id)
                            const answerLabel = pick ? getAnswerLabel(pick, pathway.id, stop.id) : '—'
                            const dotColor = STEP_COLORS[idx % STEP_COLORS.length]
                            const qData = (QUIZZES as any)[pathway.id]?.[stop.id] || {}
                            const resultLabel = qData.result || stop.name
                            return (
                              <div key={stop.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', background: '#fff', border: '3px solid #1c1526', borderRadius: 7 }}>
                                <span style={{ width: 30, height: 30, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dotColor, color: '#10285e', border: '3px solid #1c1526', fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>{pick ? '✦' : '·'}</span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ display: 'block', fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#5566a0', letterSpacing: '.4px', lineHeight: 1.5 }}>{resultLabel}</span>
                                  <span style={{ display: 'block', fontFamily: "'VT323', monospace", fontSize: 22, lineHeight: 1.2, color: pick ? '#10285e' : '#8f88ad', marginTop: 2 }}>{answerLabel}</span>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div style={{ padding: '15px 18px', background: '#10285e', borderTop: '5px solid #1c1526' }}>
                        <div style={{ fontSize: 14, lineHeight: 1.45, color: '#f2f6ff' }}>Bring this card to AJCC El Centro or your MESA advisor. Ship your first portfolio piece this week.</div>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6.5, color: '#8f88ad', letterSpacing: '.4px', marginTop: 11, lineHeight: 1.7 }}>STEWARD OS · WORKFORCE DEVELOPMENT · {pathway.name.toUpperCase()} TRAIL</div>
                      </div>
                    </div>
                  )}

                  {/* Answers detail grid (always visible) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
                    {pathway.stops.map((stop: any) => {
                      const pick = pathwayPicks.find((p: any) => p.stop_id === stop.id)
                      if (!pick) return null

                      const quizData = (QUIZZES as any)[pathway.id]?.[stop.id]
                      const answerLabel = getAnswerLabel(pick, pathway.id, stop.id)

                      return (
                        <div key={stop.id} style={{ background: 'rgba(0,0,0,.25)', border: '2px solid var(--ln,#3d2668)', borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span className="font-pixel" style={{ fontSize: 10, letterSpacing: 1, background: pathwayColor, color: '#12081e', padding: '3px 8px', borderRadius: 20 }}>{stop.name.toUpperCase()}</span>
                            {stop.optional && (
                              <span className="font-pixel" style={{ fontSize: 9, letterSpacing: 0.5, background: 'rgba(255,255,255,.1)', color: 'var(--mu,#a493c9)', padding: '2px 6px', borderRadius: 10 }}>OPTIONAL</span>
                            )}
                          </div>

                          <div style={{ fontSize: 17, color: 'var(--mu,#a493c9)', marginBottom: 8, lineHeight: 1.4 }}>
                            {quizData?.prompt || 'Your answer'}
                          </div>

                          <div style={{ fontWeight: 700, color: 'var(--tx,#efe6ff)', fontSize: 17, lineHeight: 1.3, padding: '10px 12px', background: 'rgba(255,255,255,.05)', borderRadius: 8, border: '1px solid var(--ln,#3d2668)' }}>
                            {answerLabel}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Section E: Certificate (hidden for guests) ── */}
      {userRole !== 'guest' && (
      <div
        style={{
          border: '2px solid var(--ok,#74f0a0)',
          borderRadius: 12,
          background: 'linear-gradient(180deg,rgba(116,240,160,.08),var(--pn,#241542))',
          padding: 'clamp(14px,2vw,20px)',
          marginTop: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div className="font-pixel" style={{ fontSize: 11, color: 'var(--ok,#74f0a0)' }}>
            ◈ CERTIFICATE
          </div>
          <span style={{ fontSize: 13, color: 'var(--mu,#a493c9)' }}>{delivPct >= 75 ? '100% complete' : `${Math.round((delivPct / 75) * 100)}% complete`}</span>
        </div>

        {/* Certificate eligibility based on deliverables only (75% = all 3 deliverables approved) */}
        {delivPct >= 75 ? (
          <div style={{ padding: 20, background: 'rgba(116,240,160,.1)', border: '2px solid var(--ok,#74f0a0)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#2E5534,#4a8a5a)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📜</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ok,#74f0a0)', fontSize: 22 }}>Congratulations!</div>
                <div style={{ fontSize: 18, color: 'var(--mu,#a493c9)' }}>
                  You&apos;ve completed all 3 deliverables in {cohortName} and earned your certificate.
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCertPreview(true)}
                className="font-pixel"
                style={{ background: 'transparent', color: 'var(--ok,#74f0a0)', border: '2px solid var(--ok,#74f0a0)', borderRadius: 8, padding: '11px 20px', cursor: 'pointer', fontSize: 10, letterSpacing: 0.5 }}
              >
                ◆ PREVIEW CERTIFICATE
              </button>
              <button
                onClick={handleDownloadCertificate}
                disabled={isDownloadingPDF}
                className="font-pixel"
                style={{ background: isDownloadingPDF ? '#4a6a5a' : 'var(--ok,#74f0a0)', color: '#12081e', border: 'none', borderRadius: 8, padding: '11px 20px', cursor: isDownloadingPDF ? 'not-allowed' : 'pointer', fontSize: 10, letterSpacing: 0.5, opacity: isDownloadingPDF ? 0.7 : 1 }}
              >
                {isDownloadingPDF ? '⏳ GENERATING...' : '⛊ DOWNLOAD CERTIFICATE'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: 30, textAlign: 'center', background: 'rgba(0,0,0,.2)', border: '2px dashed var(--ln,#3d2668)', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 600, color: 'var(--tx,#efe6ff)', marginBottom: 8 }}>Certificate Locked</div>
            <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', lineHeight: 1.5 }}>
              Complete all 3 deliverables to unlock your certificate.
              <br />
              <span style={{ fontSize: 12, opacity: 0.8 }}>Deliverables: {delivPct}% / 75%</span>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Certificate Preview Modal */}
      {showCertPreview && userRole !== 'guest' && (
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
              className="font-pixel"
              style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, color: '#8a6a2a', background: 'rgba(0,0,0,.05)', border: '2px solid #c9a24a', borderRadius: 4, padding: '7px 9px', cursor: 'pointer', zIndex: 3 }}
            >
              ✕
            </button>
            <div style={{ padding: 'clamp(26px,4.5vw,48px) clamp(22px,4.5vw,56px)', textAlign: 'center', position: 'relative' }}>
              <div className="font-pixel" style={{ fontSize: 8, letterSpacing: 3, color: '#a07d2c' }}>✦ {certSettings.certOrg.toUpperCase()} ✦</div>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', letterSpacing: 5, color: '#8a6a2a', marginTop: 9, textTransform: 'uppercase' }}>Pilot Workshops · The Steward&apos;s Journey</div>
              <div style={{ height: 2, width: 130, background: '#c9a24a', margin: '18px auto' }}></div>
              <div style={{ fontSize: 'clamp(25px,4.8vw,42px)', fontWeight: 700, letterSpacing: 2, color: '#241a08' }}>Certificate of Completion</div>
              <div style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#5a4626', marginTop: 22, fontStyle: 'italic' }}>This certifies that</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, margin: '12px 0 6px', flexWrap: 'wrap' }}>
                <PixelSprite characterKey={character.character_key} accent={character.accent_color || '#ffd23f'} size={48} opts={{ gear: (character as any).gear || 'none', outfit: (character as any).outfit || 'plain' }} />
                <div style={{ fontSize: 'clamp(23px,4.2vw,36px)', fontWeight: 700, color: '#1a1206', borderBottom: '2px solid #c9a24a', padding: '0 18px 6px' }}>{character.player_name || character.character_key.toUpperCase()}</div>
              </div>
              <div style={{ fontSize: 13, color: '#8a6a2a', letterSpacing: 2, marginBottom: 22, textTransform: 'uppercase' }}>Steward · Certified Steward</div>
              
              <div style={{ fontSize: 'clamp(15px,1.9vw,17px)', lineHeight: 1.75, color: '#3a2c14', maxWidth: 580, margin: '0 auto' }}>
                {certSettings.certMessage || 'has journeyed the full three-day intensive of The Steward\'s Journey, practicing Active Production over Passive Consumption and banking three original deliverables into the StewardWorks portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of 12 Steward Principles carried forward — this steward is hereby conferred the standing of Certified Steward.'}
              </div>

              {/* Deliverables of Record */}
              <div style={{ borderTop: '2px solid #dcc890', borderBottom: '2px solid #dcc890', margin: '26px auto', padding: '18px 0', maxWidth: 580, textAlign: 'left' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, textAlign: 'center', marginBottom: 15 }}>◆ DELIVERABLES OF RECORD ◆</div>
                {days.slice(0, 3).map((day, idx) => {
                  const submission = submissions.find((s: any) => s.workshop_day_id === day.id)
                  const userTitle = submission?.title || (day as any).deliverable_title?.toUpperCase() || day.title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`
                  return (
                    <div key={day.id} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 11 }}>
                      <div className="font-pixel" style={{ flex: 'none', fontSize: 10, fontWeight: 700, color: '#8a6a2a', minWidth: 60 }}>DAY {String(idx + 1).padStart(2, '0')}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, color: '#241a08', fontWeight: 700 }}>{userTitle.toUpperCase()}</div>
                      </div>
                    </div>
                  )
                })}
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
                  <div className="font-pixel" style={{ fontSize: 6, color: '#8a6a2a', marginTop: 7, letterSpacing: 2 }}>OFFICIAL SEAL</div>
                </div>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{character.player_name || character.character_key.toUpperCase()}</div>
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
                <div>CERTIFICATE NO. SW-{character.character_key.toUpperCase()}-{Date.now().toString().slice(-4)}</div>
              </div>

              {/* Funding Logos */}
              <div style={{ borderTop: '1px solid rgba(138,106,42,.3)', margin: '24px auto 0', paddingTop: 20, paddingBottom: 0, maxWidth: 580, textAlign: 'center' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, marginBottom: 12 }}>WITH FUNDING FROM JOBS FIRST THROUGH SDSU</div>
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
      
      {/* Rich Text Editor Modal for Notes */}
      {showNoteEditor && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} 
          onClick={() => setShowNoteEditor(false)}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .portfolio-rich-editor .border.rounded-md.shadow-sm.bg-white {
              background: rgba(0,0,0,.4) !important;
              border-color: var(--ln,#3d2668) !important;
            }
            .portfolio-rich-editor .bg-gray-50 {
              background: rgba(0,0,0,.3) !important;
            }
            .portfolio-rich-editor .text-gray-700 {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-rich-editor .hover\\:bg-gray-200:hover {
              background: rgba(255,210,63,.2) !important;
            }
            .portfolio-rich-editor .bg-gray-200 {
              background: var(--gold,#ffd23f) !important;
              color: #12081e !important;
            }
            .portfolio-rich-editor .bg-white {
              background: rgba(0,0,0,.2) !important;
            }
            .portfolio-rich-editor .prose {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-rich-editor .prose h1,
            .portfolio-rich-editor .prose h2,
            .portfolio-rich-editor .prose h3 {
              color: var(--gold,#ffd23f) !important;
            }
            .portfolio-rich-editor .prose a {
              color: var(--s,#45d6ff) !important;
            }
            .portfolio-rich-editor .prose strong {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-rich-editor .bg-gray-300 {
              background: var(--ln,#3d2668) !important;
            }
          `}} />
          <div 
            style={{ background: '#12081e', border: '2px solid var(--gold,#ffd23f)', borderRadius: 12, maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--ln,#3d2668)', position: 'sticky', top: 0, background: '#12081e', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="font-pixel" style={{ fontSize: 14, color: 'var(--gold,#ffd23f)' }}>✎ ADD NOTE</div>
                <button onClick={() => setShowNoteEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
              </div>
              <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginTop: 8 }}>Create a rich text note with formatting, images, and links</div>
            </div>
            
            <div style={{ padding: '20px 24px' }}>
              {/* Title Input */}
              <div style={{ marginBottom: 18 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>TITLE *</label>
                <input 
                  type="text"
                  value={richNoteTitle}
                  onChange={(e) => setRichNoteTitle(e.target.value)}
                  placeholder="Enter a title for your note..."
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    background: 'rgba(0,0,0,.4)', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    fontSize: 17, 
                    color: 'var(--tx,#efe6ff)', 
                    outline: 'none' 
                  }}
                  autoFocus
                />
              </div>
              
              {/* Rich Text Editor */}
              <div style={{ marginBottom: 20 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--gold,#ffd23f)', marginBottom: 8 }}>CONTENT *</label>
                <div className="portfolio-rich-editor" style={{ border: '2px solid var(--ln,#3d2668)', borderRadius: 8, overflow: 'hidden' }}>
                  <RichTextEditor 
                    content={richNoteContent}
                    onChange={(html) => setRichNoteContent(html)}
                    onUpload={async (formData) => {
                      const res = await uploadCreationImage(formData);
                      return { publicUrl: res, type: 'image' };
                    }}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowNoteEditor(false)} 
                  style={{ 
                    background: 'transparent', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    padding: '10px 20px', 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: 'var(--mu,#a493c9)', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitRichNote}
                  disabled={isSavingNote || !richNoteTitle.trim() || !richNoteContent.trim()}
                  className="font-pixel"
                  style={{ 
                    background: isSavingNote || !richNoteTitle.trim() || !richNoteContent.trim() ? 'var(--mu,#a493c9)' : 'var(--gold,#ffd23f)', 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '10px 24px', 
                    fontSize: 12, 
                    color: '#12081e', 
                    cursor: isSavingNote || !richNoteTitle.trim() || !richNoteContent.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSavingNote || !richNoteTitle.trim() || !richNoteContent.trim() ? 0.5 : 1
                  }}
                >
                  {isSavingNote ? 'SAVING...' : 'SAVE NOTE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rich Text Editor Modal for Prompts */}
      {showPromptEditor && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} 
          onClick={() => setShowPromptEditor(false)}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .portfolio-rich-editor .border.rounded-md.shadow-sm.bg-white {
              background: rgba(0,0,0,.4) !important;
              border-color: var(--ln,#3d2668) !important;
            }
            .portfolio-rich-editor .bg-gray-50 {
              background: rgba(0,0,0,.3) !important;
            }
            .portfolio-rich-editor .text-gray-700 {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-rich-editor .hover\\:bg-gray-200:hover {
              background: rgba(255,95,210,.2) !important;
            }
            .portfolio-rich-editor .bg-gray-200 {
              background: var(--p,#ff5fd2) !important;
              color: #12081e !important;
            }
            .portfolio-rich-editor .bg-white {
              background: rgba(0,0,0,.2) !important;
            }
            .portfolio-rich-editor .prose {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-rich-editor .prose h1,
            .portfolio-rich-editor .prose h2,
            .portfolio-rich-editor .prose h3 {
              color: var(--p,#ff5fd2) !important;
            }
            .portfolio-rich-editor .prose a {
              color: var(--s,#45d6ff) !important;
            }
            .portfolio-rich-editor .prose strong {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-rich-editor .bg-gray-300 {
              background: var(--ln,#3d2668) !important;
            }
          `}} />
          <div 
            style={{ background: '#12081e', border: '2px solid var(--p,#ff5fd2)', borderRadius: 12, maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--ln,#3d2668)', position: 'sticky', top: 0, background: '#12081e', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="font-pixel" style={{ fontSize: 14, color: 'var(--p,#ff5fd2)' }}>⌘ ADD PROMPT</div>
                <button onClick={() => setShowPromptEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
              </div>
              <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginTop: 8 }}>Save a prompt with rich formatting for future reference</div>
            </div>
            
            <div style={{ padding: '20px 24px' }}>
              {/* Title Input */}
              <div style={{ marginBottom: 18 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--p,#ff5fd2)', marginBottom: 8 }}>TITLE *</label>
                <input 
                  type="text"
                  value={richPromptTitle}
                  onChange={(e) => setRichPromptTitle(e.target.value)}
                  placeholder="Enter a title for your prompt..."
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    background: 'rgba(0,0,0,.4)', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    fontSize: 17, 
                    color: 'var(--tx,#efe6ff)', 
                    outline: 'none' 
                  }}
                  autoFocus
                />
              </div>
              
              {/* Rich Text Editor */}
              <div style={{ marginBottom: 20 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--p,#ff5fd2)', marginBottom: 8 }}>PROMPT CONTENT *</label>
                <div className="portfolio-rich-editor" style={{ border: '2px solid var(--ln,#3d2668)', borderRadius: 8, overflow: 'hidden' }}>
                  <RichTextEditor 
                    content={richPromptContent}
                    onChange={(html) => setRichPromptContent(html)}
                    onUpload={async (formData) => {
                      const res = await uploadCreationImage(formData);
                      return { publicUrl: res, type: 'image' };
                    }}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowPromptEditor(false)} 
                  style={{ 
                    background: 'transparent', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    padding: '10px 20px', 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: 'var(--mu,#a493c9)', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitRichPrompt}
                  disabled={isSavingNote || !richPromptTitle.trim() || !richPromptContent.trim()}
                  className="font-pixel"
                  style={{ 
                    background: isSavingNote || !richPromptTitle.trim() || !richPromptContent.trim() ? 'var(--mu,#a493c9)' : 'var(--p,#ff5fd2)', 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '10px 24px', 
                    fontSize: 12, 
                    color: '#12081e', 
                    cursor: isSavingNote || !richPromptTitle.trim() || !richPromptContent.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSavingNote || !richPromptTitle.trim() || !richPromptContent.trim() ? 0.5 : 1
                  }}
                >
                  {isSavingNote ? 'SAVING...' : 'SAVE PROMPT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bookmark Editor Modal */}
      {showBookmarkEditor && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} 
          onClick={() => setShowBookmarkEditor(false)}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .portfolio-bookmark-editor .border.rounded-md.shadow-sm.bg-white {
              background: rgba(0,0,0,.4) !important;
              border-color: var(--ln,#3d2668) !important;
            }
            .portfolio-bookmark-editor .bg-gray-50 {
              background: rgba(0,0,0,.3) !important;
            }
            .portfolio-bookmark-editor .text-gray-700 {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-bookmark-editor .hover\\:bg-gray-200:hover {
              background: rgba(69,214,255,.2) !important;
            }
            .portfolio-bookmark-editor .bg-gray-200 {
              background: var(--s,#45d6ff) !important;
              color: #12081e !important;
            }
            .portfolio-bookmark-editor .bg-white {
              background: rgba(0,0,0,.2) !important;
            }
            .portfolio-bookmark-editor .prose {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-bookmark-editor .prose h1,
            .portfolio-bookmark-editor .prose h2,
            .portfolio-bookmark-editor .prose h3 {
              color: var(--s,#45d6ff) !important;
            }
            .portfolio-bookmark-editor .prose a {
              color: var(--s,#45d6ff) !important;
            }
            .portfolio-bookmark-editor .prose strong {
              color: var(--tx,#efe6ff) !important;
            }
            .portfolio-bookmark-editor .bg-gray-300 {
              background: var(--ln,#3d2668) !important;
            }
          `}} />
          <div 
            style={{ background: '#12081e', border: '2px solid var(--s,#45d6ff)', borderRadius: 12, maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--ln,#3d2668)', position: 'sticky', top: 0, background: '#12081e', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="font-pixel" style={{ fontSize: 14, color: 'var(--s,#45d6ff)' }}>☆ ADD BOOKMARK</div>
                <button onClick={() => setShowBookmarkEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 22 }}>✕</button>
              </div>
              <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginTop: 8 }}>Bookmark a resource and add your notes about it</div>
            </div>
            
            <div style={{ padding: '20px 24px' }}>
              {/* Title Input */}
              <div style={{ marginBottom: 18 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--s,#45d6ff)', marginBottom: 8 }}>TITLE (OPTIONAL)</label>
                <input 
                  type="text"
                  value={richBookmarkTitle}
                  onChange={(e) => setRichBookmarkTitle(e.target.value)}
                  placeholder="Give your bookmark a custom name..."
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    background: 'rgba(0,0,0,.4)', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    fontSize: 17, 
                    color: 'var(--tx,#efe6ff)', 
                    outline: 'none' 
                  }}
                  autoFocus
                />
                <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginTop: 6 }}>Leave blank to auto-generate from URL</div>
              </div>
              
              {/* URL Input */}
              <div style={{ marginBottom: 18 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--s,#45d6ff)', marginBottom: 8 }}>PASTE URL OR LINK *</label>
                <input 
                  type="text"
                  value={richBookmarkUrl}
                  onChange={(e) => setRichBookmarkUrl(e.target.value)}
                  placeholder="https://example.com or /library/resource-id"
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    background: 'rgba(0,0,0,.4)', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    fontSize: 17, 
                    color: 'var(--tx,#efe6ff)', 
                    outline: 'none' 
                  }}
                />
              </div>
              
              {/* File Upload Option */}
              <div style={{ marginBottom: 18 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--s,#45d6ff)', marginBottom: 8 }}>OR UPLOAD FILE</label>
                <input type="file" accept="image/*,video/*,audio/*" hidden ref={bookmarkFileInputRef} onChange={handleBookmarkFileChange} />
                <button
                  onClick={() => bookmarkFileInputRef.current?.click()}
                  disabled={isUploadingBookmark}
                  className="font-pixel"
                  style={{
                    width: '100%',
                    fontSize: 11,
                    color: 'var(--s,#45d6ff)',
                    background: 'rgba(69,214,255,.1)',
                    border: '2px dashed var(--s,#45d6ff)',
                    borderRadius: 8,
                    padding: '16px',
                    cursor: isUploadingBookmark ? 'wait' : 'pointer',
                    opacity: isUploadingBookmark ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {isUploadingBookmark ? 'UPLOADING...' : bookmarkFileToUpload ? `✓ ${bookmarkFileToUpload.name}` : '↑ CLICK TO UPLOAD FILE'}
                </button>
              </div>
              
              {/* Rich Text Editor for Description */}
              <div style={{ marginBottom: 20 }}>
                <label className="font-pixel" style={{ display: 'block', fontSize: 11, color: 'var(--s,#45d6ff)', marginBottom: 8 }}>DESCRIPTION / NOTES (OPTIONAL)</label>
                <div className="portfolio-bookmark-editor" style={{ border: '2px solid var(--ln,#3d2668)', borderRadius: 8, overflow: 'hidden' }}>
                  <RichTextEditor 
                    content={richBookmarkContent}
                    onChange={(html) => setRichBookmarkContent(html)}
                    onUpload={async (formData) => {
                      const res = await uploadCreationImage(formData);
                      return { publicUrl: res, type: 'image' };
                    }}
                  />
                </div>
                <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginTop: 6 }}>Add notes about why you bookmarked this or what you learned</div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowBookmarkEditor(false)} 
                  style={{ 
                    background: 'transparent', 
                    border: '2px solid var(--ln,#3d2668)', 
                    borderRadius: 8, 
                    padding: '10px 20px', 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: 'var(--mu,#a493c9)', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitBookmark}
                  disabled={isUploadingBookmark || (!richBookmarkUrl.trim() && !bookmarkFileToUpload)}
                  className="font-pixel"
                  style={{ 
                    background: isUploadingBookmark || (!richBookmarkUrl.trim() && !bookmarkFileToUpload) ? 'var(--mu,#a493c9)' : 'var(--s,#45d6ff)', 
                    border: 'none', 
                    borderRadius: 8, 
                    padding: '10px 24px', 
                    fontSize: 12, 
                    color: '#12081e', 
                    cursor: isUploadingBookmark || (!richBookmarkUrl.trim() && !bookmarkFileToUpload) ? 'not-allowed' : 'pointer',
                    opacity: isUploadingBookmark || (!richBookmarkUrl.trim() && !bookmarkFileToUpload) ? 0.5 : 1
                  }}
                >
                  {isUploadingBookmark ? 'SAVING...' : 'SAVE BOOKMARK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
