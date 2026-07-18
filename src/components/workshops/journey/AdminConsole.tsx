'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type {
  DayWithSections,
  WorkshopProgress,
  WorkshopPrinciple,
  WorkshopEngagement,
  WorkshopShowcase,
} from '@/types/workshops'
import {
  getSubmissionsForReview,
  reviewDeliverable,
  getPendingEngagements,
  reviewEngagement,
  getParticipantsProgress
} from '@/app/actions/workshops/admin-reviews'
import { PixelSprite } from '@/components/workshops/journey'
import { updateWorkshopDay, createWorkshopDay } from '@/app/actions/workshops/workshop-days'
import { updateCohort, uploadCohortThumbnail } from '@/app/actions/workshops/cohorts'
import { createSection, updateSection, deleteSection } from '@/app/actions/workshops/sections'
import { createEntry, updateEntry, deleteEntry } from '@/app/actions/workshops/entries'
import RichEditor from './RichEditor'
import { createEntryMedia, deleteEntryMedia, getEntryMedia, uploadEntryMedia } from '@/app/actions/workshops/entry-media'
import { createPrinciple, updatePrinciple, deletePrinciple } from '@/app/actions/workshops/principles'
import { addShowcaseItem, updateShowcaseItem, deleteShowcaseItem, getShowcaseItems, seedShowcaseItems } from '@/app/actions/workshops/showcase'
import ConfirmDialog from './ConfirmDialog'
import RetroToast from './RetroToast'

// ─── Types ─────────────────────────────────────────────────
type AdminSection = 'cohort' | 'curriculum' | 'principles' | 'contributors' | 'approvals' | 'certificate' | 'ailabs'
type SidebarGroup = 'cohort-editing' | 'approvals' | 'contributors' | 'ailabs'

interface AdminConsoleProps {
  cohortId: string
  cohortName: string
  cohort: any
  days: DayWithSections[]
  principles: WorkshopPrinciple[]
  onReturnToGame: () => void
  cameFromAdminPanel?: boolean
  onPrincipleBanked?: (principle: any) => void
}

// ─── Inline style helpers ──────────────────────────────────
const px = (s: string): React.CSSProperties => ({
  fontFamily: "'Press Start 2P', monospace",
  fontSize: s,
})

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box' as const,
  background: 'rgba(0,0,0,.4)',
  border: '2px solid var(--ln,#3d2668)',
  borderRadius: 4,
  color: 'var(--tx,#efe6ff)',
  fontSize: 17,
  padding: '9px 11px',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  lineHeight: 1.4,
  fontFamily: 'inherit',
}

// ─── Chia sprite helper ────────────────────────────────────
function chiaStageFor(pct: number): number {
  if (pct >= 100) return 5; if (pct >= 75) return 4; if (pct >= 50) return 3; if (pct >= 25) return 2; if (pct > 0) return 1; return 0;
}
function chiaUri(pct: number): string {
  const stage = chiaStageFor(pct);
  const gL='#d9b34d',gM='#c19a33',gD='#9c7a28',eye='#3a2c14',bD='#1c150f',bM='#33281b',gr='#5fa83c',gr2='#8fd85f',fp='#ff5fd2',fy='#ffd23f',fv='#b06bff';
  type R=[number,number,number,number,string];
  const base:R[]=[[2,18,12,2,bD],[3,18,10,1,bM],[6,11,4,1,gL],[5,12,6,1,gM],[5,13,6,1,gM],[4,14,8,1,gM],[4,15,8,1,gD],[3,16,10,1,gM],[3,17,10,1,gD],[5,16,6,1,gL],[7,10,2,1,gM],[6,5,4,1,gL],[5,6,6,1,gL],[5,7,6,1,gM],[5,8,6,1,gM],[6,9,4,1,gD],[6,7,1,1,eye],[9,7,1,1,eye]];
  const defs:Record<number,R[]>={1:[[6,3,1,2,gr],[8,3,1,2,gr],[7,2,1,3,gr],[7,2,1,1,gr2]],2:[[5,2,1,3,gr],[7,1,1,4,gr],[9,2,1,3,gr],[8,2,1,3,gr],[7,1,1,1,gr2],[5,2,1,1,gr2],[9,2,1,1,gr2]],3:[[5,1,1,4,gr],[6,2,1,3,gr],[7,0,1,5,gr],[8,1,1,4,gr],[9,2,1,3,gr],[10,3,1,2,gr],[7,0,1,1,gr2],[5,1,1,1,gr2],[9,2,1,1,gr2]],4:[[4,3,1,2,gr],[5,1,1,4,gr],[6,0,1,5,gr],[7,0,1,5,gr],[8,1,1,4,gr],[9,0,1,5,gr],[10,2,1,3,gr],[6,0,1,1,gr2],[9,0,1,1,gr2],[7,0,1,1,gr2]]};
  let rects=[...base];
  if(stage>=1&&stage<5&&defs[stage])rects=rects.concat(defs[stage]);
  if(stage>=5){rects=rects.concat([[5,2,1,3,gr],[6,1,1,3,gr],[9,1,1,3,gr],[10,2,1,3,gr],[7,2,1,2,gr],[8,2,1,2,gr],[4,0,2,2,fp],[7,0,2,2,fy],[10,0,2,2,fv]] as R[]);}
  const body=rects.map(a=>`<rect x='${a[0]}' y='${a[1]}' width='${a[2]}' height='${a[3]}' fill='${a[4]}'/>`).join('');
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20' shape-rendering='crispEdges'><rect width='16' height='20' fill='transparent'/>${body}</svg>`);
}

// ─── Component ─────────────────────────────────────────────
export default function AdminConsole({
  cohortId,
  cohortName,
  cohort,
  days,
  principles,
  onReturnToGame,
  cameFromAdminPanel,
  onPrincipleBanked,
}: AdminConsoleProps) {
  // Extract thumbnail once
  const rawDesc = cohort?.description || ''
  let initialDesc = rawDesc
  let initialThumb = ''
  const match = rawDesc.match(/<div data-thumbnail="(.*?)" style="display:none;"><\/div>/)
  if (match) {
    initialThumb = match[1]
    initialDesc = rawDesc.replace(match[0], '').trim()
  }

  const router = useRouter()
  const [section, setSection] = useState<AdminSection>('cohort')
  const [cohortThumb, setCohortThumb] = useState(initialThumb)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [entryMediaList, setEntryMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingMediaKind, setUploadingMediaKind] = useState<'photo' | 'video' | 'audio' | null>(null)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [daysData, setDaysData] = useState(days)

  // Principles state
  const [principlesList, setPrinciplesList] = useState(principles)
  const [openPrinciple, setOpenPrinciple] = useState<string | null>(null)
  const [newPrName, setNewPrName] = useState('')
  const [newPrDesc, setNewPrDesc] = useState('')
  const [newPrExample, setNewPrExample] = useState('')

  // Contributors state
  const [ncType, setNcType] = useState<string>('video')
  const [ncTitle, setNcTitle] = useState('')
  const [ncAuthor, setNcAuthor] = useState('')
  const [ncEmail, setNcEmail] = useState('')
  const [ncLink, setNcLink] = useState('')
  const [ncBlurb, setNcBlurb] = useState('')
  const [ncMeta, setNcMeta] = useState('')
  const [ncPaid, setNcPaid] = useState(true)
  const [showcaseList, setShowcaseList] = useState<WorkshopShowcase[]>([])
  const [editingShowcaseId, setEditingShowcaseId] = useState<string | null>(null)

  // Approvals state
  const [approvalView, setApprovalView] = useState<'log' | 'steward'>('log')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [participantsProgress, setParticipantsProgress] = useState<any[]>([])
  // Toast and confirm dialog state
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)

  React.useEffect(() => {
    const loadApprovals = async () => {
      setIsLoadingApprovals(true)
      try {
        const [subs, engs, progress] = await Promise.all([
          getSubmissionsForReview(cohortId, 'submitted'),
          getPendingEngagements(cohortId),
          getParticipantsProgress(cohortId)
        ])
        
        // Merge and sort them chronologically (newest first)
        const allPending = [...subs, ...engs].sort(
          (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        )
        setPendingSubmissions(allPending)
        setParticipantsProgress(progress)
      } catch (e) {
        console.error('Failed to load approvals', e)
      } finally {
        setIsLoadingApprovals(false)
      }
    }
    loadApprovals()
  }, [cohortId])

  // Load showcase items
  React.useEffect(() => {
    const loadShowcase = async () => {
      try {
        const items = await getShowcaseItems(cohortId)
        setShowcaseList((items || []) as WorkshopShowcase[])
      } catch (e) {
        console.error('Failed to load showcase items', e)
        setShowcaseList([])
      }
    }
    loadShowcase()
  }, [cohortId])

  const handleReview = async (progressId: string, status: 'approved' | 'rejected', note?: string, isEngagement?: boolean) => {
    try {
      if (isEngagement) {
        await reviewEngagement(progressId, status, note)
      } else {
        const result = await reviewDeliverable(progressId, status, note)
        // If approved and we have a banked principle, notify parent
        if (status === 'approved' && result.bankedPrinciple && onPrincipleBanked) {
          onPrincipleBanked(result.bankedPrinciple)
        }
      }
      setPendingSubmissions(prev => prev.filter(p => (p.progress_id || p.id) !== progressId))
      setReviewNotes(prev => {
        const next = { ...prev };
        delete next[progressId];
        return next;
      });
    } catch (e) {
      console.error('Failed to review item', e)
    }
  }

  // Certificate State
  const [certOrg, setCertOrg] = useState('StewardWorks')
  const [certFacilitator, setCertFacilitator] = useState('Marisol Vega')
  const [certFacTitle, setCertFacTitle] = useState('Lead Steward')
  const [certSponsor, setCertSponsor] = useState('Signer name')
  const [certSponsorOrg, setCertSponsorOrg] = useState('The Becoming Project')
  const [certMessage, setCertMessage] = useState('')
  const [showCertPreview, setShowCertPreview] = useState(false)
  const [certSaving, setCertSaving] = useState(false)

  // Fetch certificate settings from database on mount
  React.useEffect(() => {
    const fetchCertSettings = async () => {
      try {
        const response = await fetch(`/api/workshops/${cohortId}/certificate-settings`)
        if (response.ok) {
          const data = await response.json()
          setCertOrg(data.certOrg)
          setCertFacilitator(data.certFacilitator)
          setCertFacTitle(data.certFacTitle)
          setCertSponsor(data.certSponsor)
          setCertSponsorOrg(data.certSponsorOrg)
          setCertMessage(data.certMessage)
        }
      } catch (e) {
        console.error('Failed to fetch cert settings', e)
      }
    }
    fetchCertSettings()
  }, [cohortId])

  const saveCertSettings = async (updates: any) => {
    setCertSaving(true)
    try {
      const current = { certOrg, certFacilitator, certFacTitle, certSponsor, certSponsorOrg, certMessage }
      const newSettings = { ...current, ...updates }
      
      const response = await fetch(`/api/workshops/${cohortId}/certificate-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error('Failed to save certificate settings')
      }
    } catch (e) {
      console.error('Failed to save cert settings', e)
    } finally {
      setCertSaving(false)
    }
  }

  const refreshCertSettings = async () => {
    try {
      const response = await fetch(`/api/workshops/${cohortId}/certificate-settings`)
      if (response.ok) {
        const data = await response.json()
        setCertOrg(data.certOrg)
        setCertFacilitator(data.certFacilitator)
        setCertFacTitle(data.certFacTitle)
        setCertSponsor(data.certSponsor)
        setCertSponsorOrg(data.certSponsorOrg)
        setCertMessage(data.certMessage)
      }
    } catch (e) {
      console.error('Failed to refresh cert settings', e)
    }
  }

  // ─── Save helpers ────────────────────────────────────────
  const saveField = async (fn: () => Promise<any>) => {
    setIsSaving(true)
    try { await fn() } catch (e) { console.error('Save failed:', e) } finally { setIsSaving(false) }
  }

  const handleDayFieldBlur = (dayId: string, field: string, value: string) => {
    saveField(() => updateWorkshopDay(dayId, { [field]: value } as any))
    setDaysData(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d))
  }

  const handleSectionFieldBlur = (sectionId: string, field: string, value: string) => {
    saveField(() => updateSection(sectionId, { [field]: value } as any))
    setDaysData(prev => prev.map(d => ({
      ...d,
      sections: (d.sections || []).map((s: any) => s.id === sectionId ? { ...s, [field]: value } : s)
    })))
  }

  const handleAddEntry = async (sectionId: string) => {
    saveField(async () => {
      const entry = await createEntry(sectionId, { entry_type: 'text', title: 'New Entry' })
      if (entry) {
        setDaysData(prev => prev.map(d => ({
          ...d,
          sections: (d.sections || []).map((s: any) =>
            s.id === sectionId
              ? { ...s, entries: [...(s.entries || []), entry] }
              : s
          )
        })))
        setSelectedEntry(entry.id)
        setEditorOpen(true)
      }
    })
  }

  const handleDeleteEntry = async (entryId: string, sectionId: string) => {
    if (!confirm('Delete this entry?')) return
    saveField(async () => {
      await deleteEntry(entryId)
      setDaysData(prev => prev.map(d => ({
        ...d,
        sections: (d.sections || []).map((s: any) =>
          s.id === sectionId
            ? { ...s, entries: (s.entries || []).filter((e: any) => e.id !== entryId) }
            : s
        )
      })))
      if (selectedEntry === entryId) setSelectedEntry(null)
    })
  }

  const handleAddSection = async (dayId: string) => {
    const activeD = daysData[activeDayIdx]
    const nextKey = String.fromCharCode(65 + (activeD?.sections?.length || 0))
    saveField(async () => {
      const sec = await createSection(dayId, { section_key: nextKey, title: `Session ${nextKey}` })
      if (sec) {
        setDaysData(prev => prev.map(d =>
          d.id === dayId
            ? { ...d, sections: [...(d.sections || []), { ...sec, entries: [] }] }
            : d
        ))
      }
    })
  }

  const handleDeleteSection = async (sectionId: string, dayId: string) => {
    if (!confirm('Delete this entire section and all its entries?')) return
    saveField(async () => {
      await deleteSection(sectionId)
      setDaysData(prev => prev.map(d =>
        d.id === dayId
          ? { ...d, sections: (d.sections || []).filter((s: any) => s.id !== sectionId) }
          : d
      ))
    })
  }

  const handleAddDay = async () => {
    const nextDayNum = daysData.length + 1
    saveField(async () => {
      const newDay = await createWorkshopDay(cohortId, {
        day_number: nextDayNum,
        title: `Day ${nextDayNum}`,
        requires_admin_approval: false,
        deliverable_type: 'pending_confirmation',
        content_body: '',
        deliverable_instructions: ''
      })
      if (newDay) {
        setDaysData(prev => [...prev, { ...newDay, sections: [] } as any])
        setActiveDayIdx(daysData.length) // Switch to the new day
        setSelectedEntry(null)
      }
    })
  }

  const handleEntryFieldBlur = (entryId: string, field: string, value: string) => {
    saveField(() => updateEntry(entryId, { [field]: value } as any))
    setDaysData(prev => prev.map(d => ({
      ...d,
      sections: (d.sections || []).map((s: any) => ({
        ...s,
        entries: (s.entries || []).map((e: any) => e.id === entryId ? { ...e, [field]: value } : e)
      }))
    })))
  }

  const handleAddMedia = async (entryId: string, kind: 'link' | 'photo' | 'video' | 'audio') => {
    if (kind === 'link') {
      const url = prompt(`Enter ${kind} URL:`)
      if (!url) return
      saveField(async () => {
        await createEntryMedia(entryId, { kind, url, label: '' })
        const updatedMedia = await getEntryMedia(entryId)
        setEntryMediaList(updatedMedia)
      })
    } else {
      setUploadingMediaKind(kind)
      // Small timeout to ensure state is set before click
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 50)
    }
  }

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingMediaKind || !selectedEntry) return
    
    // Clear input so we can upload same file again if needed
    e.target.value = ''
    
    const formData = new FormData()
    formData.append('entryId', selectedEntry)
    formData.append('file', file)
    formData.append('kind', uploadingMediaKind)
    
    setIsUploadingMedia(true)
    saveField(async () => {
      try {
        await uploadEntryMedia(formData)
        const updatedMedia = await getEntryMedia(selectedEntry)
        setEntryMediaList(updatedMedia)
      } finally {
        setIsUploadingMedia(false)
        setUploadingMediaKind(null)
      }
    })
  }

  const handleRemoveMedia = async (mediaId: string, entryId: string) => {
    if (!confirm('Remove this media attachment?')) return
    saveField(async () => {
      await deleteEntryMedia(mediaId)
      const updatedMedia = await getEntryMedia(entryId)
      setEntryMediaList(updatedMedia)
    })
  }

  useEffect(() => {
    if (editorOpen && selectedEntry) {
      setIsLoadingMedia(true)
      getEntryMedia(selectedEntry).then(data => {
        setEntryMediaList(data)
        setIsLoadingMedia(false)
      })
    }
  }, [editorOpen, selectedEntry])

  // Principles handlers
  const handleAddPrinciple = async () => {
    if (!newPrName.trim()) return
    saveField(async () => {
      const p = await createPrinciple({ cohort_id: cohortId, name: newPrName, description: newPrDesc, example: newPrExample })
      if (p) {
        setPrinciplesList(prev => [...prev, p as any])
        setNewPrName(''); setNewPrDesc(''); setNewPrExample('')
      }
    })
  }

  const handleUpdatePrinciple = (principleId: string, field: string, value: string) => {
    saveField(() => updatePrinciple(principleId, { [field]: value } as any))
  }

  const handleDeletePrinciple = async (principleId: string) => {
    if (!confirm('Remove this principle?')) return
    saveField(async () => {
      await deletePrinciple(principleId)
      setPrinciplesList(prev => prev.filter(p => p.id !== principleId))
    })
  }

  // Contributors handler
  const handlePublishContributor = async () => {
    if (!ncTitle.trim()) return
    setIsSaving(true)
    try {
      if (editingShowcaseId) {
        // Update existing item
        await updateShowcaseItem(editingShowcaseId, {
          title: ncTitle,
          author: ncAuthor || 'Community Contributor',
          type: ncType,
          url: ncLink || undefined,
          blurb: ncBlurb || 'Contributor media.',
          meta: ncMeta || '',
          is_paid: ncPaid,
          theme: 'How to Use AI',
        })
        setEditingShowcaseId(null)
      } else {
        // Add new item
        await addShowcaseItem(cohortId, {
          title: ncTitle,
          author: ncAuthor || 'Community Contributor',
          type: ncType,
          url: ncLink || undefined,
          blurb: ncBlurb || 'Contributor media.',
          meta: ncMeta || '',
          is_paid: ncPaid,
          theme: 'How to Use AI',
        })
      }

      // Send invitation email if email is provided
      if (ncEmail.trim() && !editingShowcaseId) {
        try {
          const inviteRes = await fetch('/api/admin/invite-guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ncEmail.trim() }),
          })
          
          if (inviteRes.ok) {
            setToast(`✓ Contributor published and invitation sent to ${ncEmail}`)
          } else {
            const errorData = await inviteRes.json()
            setToast(`✓ Contributor published but invitation failed: ${errorData.error || 'Unknown error'}`)
          }
        } catch (inviteError) {
          console.error('Failed to send invitation:', inviteError)
          setToast('✓ Contributor published but invitation email failed to send')
        }
      } else if (!editingShowcaseId) {
        setToast('✓ Contributor published successfully')
      } else {
        setToast('✓ Contributor updated successfully')
      }
      
      // Clear form
      setNcTitle('')
      setNcAuthor('')
      setNcEmail('')
      setNcLink('')
      setNcBlurb('')
      setNcMeta('')
      
      // Reload showcase list
      const items = await getShowcaseItems(cohortId)
      setShowcaseList(items as WorkshopShowcase[])
    } catch (e: any) {
      console.error('Failed to publish contributor', e)
      setToast('✗ Failed to publish contributor')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishFromSubmission = async (sub: any, principleName: string) => {
    setIsSaving(true)
    try {
      await addShowcaseItem(cohortId, {
        title: sub.title || 'Student Deliverable',
        author: sub.profiles?.full_name || sub.author || 'Student',
        type: sub.url && (sub.url.includes('youtube') || sub.url.includes('vimeo')) ? 'video' : 'article',
        url: sub.url || undefined,
        blurb: `A fantastic student submission applying: ${principleName || 'key concepts'}.`,
        meta: principleName ? `Principle: ${principleName}` : 'Student Deliverable',
        is_paid: false,
        theme: 'How to Use AI',
      })
      
      // Auto-approve the deliverable as well since it's going to showcase
      if (sub.deliverable_status !== 'approved') {
        await handleReview(sub.progress_id || sub.id, 'approved', undefined, !sub.workshop_day_id)
      }
      
      // Reload showcase list
      const items = await getShowcaseItems(cohortId)
      setShowcaseList(items as WorkshopShowcase[])
      
      // We do a hacky removal of the SHOWCASE_REQUESTED flag from the local state so the badge disappears
      setPendingSubmissions(prev => prev.map(p => {
        if ((p.progress_id || p.id) === (sub.progress_id || sub.id)) {
          return { ...p, submission_text: (p.submission_text || '').replace('[SHOWCASE_REQUESTED]', '[SHOWCASE_APPROVED]') }
        }
        return p
      }))
    } catch (e: any) {
      console.error('Failed to publish from submission', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditShowcase = (item: WorkshopShowcase) => {
    setEditingShowcaseId(item.id)
    setNcType(item.type)
    setNcTitle(item.title)
    setNcAuthor(item.author || '')
    setNcEmail('')
    setNcLink(item.url || '')
    setNcBlurb(item.blurb || '')
    setNcMeta(item.meta || '')
    setNcPaid(item.is_paid)
  }

  const handleCancelEdit = () => {
    setEditingShowcaseId(null)
    setNcTitle('')
    setNcAuthor('')
    setNcEmail('')
    setNcLink('')
    setNcBlurb('')
    setNcMeta('')
  }

  const handleDeleteShowcase = async (id: string) => {
    setConfirmDialog({
      message: 'Delete this showcase item? This cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(null)
        setIsSaving(true)
        try {
          await deleteShowcaseItem(id)
          // Reload showcase list
          const items = await getShowcaseItems(cohortId)
          setShowcaseList(items as WorkshopShowcase[])
          setToast('✓ Showcase item deleted successfully')
        } catch (e: any) {
          console.error('Failed to delete showcase item', e)
          setToast('✗ Failed to delete showcase item')
        } finally {
          setIsSaving(false)
        }
      }
    })
  }

  const handleSeedShowcase = async () => {
    if (!confirm('This will add 9 sample showcase items to your cohort. Continue?')) return
    setIsSaving(true)
    try {
      await seedShowcaseItems(cohortId)
      // Reload showcase list
      const items = await getShowcaseItems(cohortId)
      setShowcaseList(items as WorkshopShowcase[])
    } catch (e: any) {
      console.error('Failed to seed showcase items', e)
      alert('Failed to seed showcase items: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const activeDay = daysData[activeDayIdx] || null

  // Find entries for the selected day
  const allEntries = activeDay?.sections?.flatMap((sec: any, si: number) =>
    (sec.entries || []).map((en: any, ei: number) => ({
      ...en,
      sectionTitle: sec.title || sec.hour || `Section ${si + 1}`,
      sectionHour: sec.hour,
      num: `${si + 1}.${ei + 1}`,
    }))
  ) || []

  const selEntry = allEntries.find((e: any) => e.id === selectedEntry) || allEntries[0] || null

  // ─── Sidebar nav button ──────────────────────────────────
  const cohortEditingSections: AdminSection[] = ['cohort', 'curriculum', 'principles', 'certificate']
  const isCohortEditing = cohortEditingSections.includes(section)
  
  const NavBtn = ({ id, icon, label, count }: { id: AdminSection; icon: string; label: string; count?: number }) => {
    const active = id === 'cohort' ? isCohortEditing : section === id
    const col = 'var(--gold,#ffd23f)'
    return (
      <button
        onClick={() => setSection(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '9px',
          lineHeight: '1.6',
          cursor: 'pointer',
          padding: '13px 12px',
          borderRadius: '8px',
          border: `2px solid ${active ? col : '#3d2668'}`,
          background: active ? col : 'rgba(0,0,0,.25)',
          color: active ? '#12081e' : '#efe6ff',
          textAlign: 'left',
          boxShadow: active ? `0 0 14px ${col}` : 'none',
        }}
      >
        <span>{icon} {label}</span>
        {count !== undefined && (
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '7px',
            padding: '4px 6px',
            borderRadius: '4px',
            flex: 'none',
            background: active ? 'rgba(0,0,0,.3)' : col,
            color: active ? '#efe6ff' : '#12081e',
          }}>
            {count}
          </span>
        )}
      </button>
    )
  }

  // ─── Return to Game button ───────────────────────────────
  const ReturnBtn = ({ wide }: { wide?: boolean }) => (
    <button
      onClick={() => {
        if (cameFromAdminPanel) {
          router.push('/admin/pilot-workshops')
        } else {
          onReturnToGame()
        }
      }}
      style={wide ? {
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '8px',
        lineHeight: '1.6',
        cursor: 'pointer',
        padding: '11px 10px',
        borderRadius: '8px',
        border: '2px solid var(--s,#45d6ff)',
        background: 'rgba(69,214,255,.08)',
        color: 'var(--s,#45d6ff)',
        textAlign: 'center',
        boxShadow: '0 0 12px rgba(69,214,255,.25)'
      } : {
        padding: '11px 14px',
        borderRadius: 6,
        border: '2px solid var(--s,#45d6ff)',
        background: 'transparent',
        color: 'var(--s,#45d6ff)',
        whiteSpace: 'nowrap',
        flex: 'none',
        boxShadow: '0 0 12px rgba(69,214,255,.25)'
      }}
    >
      {cameFromAdminPanel ? '◂ RETURN TO ADMIN' : '◂ RETURN TO GAME'}
    </button>
  )

  const rootStyle = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 'clamp(14px,2.5vw,26px) clamp(12px,3vw,24px)',
    '--p': '#c98bad',
    '--s': '#8aa6c4',
    '--ok': '#86b89a',
    '--gold': '#c9a85f',
    '--tx': '#e4e0ee',
    '--mu': '#9990ab',
    '--ln': '#3a3352',
    '--pn': '#201a30',
    '--bg': '#14101f',
  } as React.CSSProperties

  return (
    <div style={rootStyle}>

      {/* ═══ Console Header ═══ */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 14,
        justifyContent: 'space-between',
        border: '2px solid var(--ln,#3a3352)',
        borderRadius: 12,
        padding: '15px 19px',
        background: '#201a30',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <svg width="26" height="26" viewBox="0 0 16 16" style={{ flex: 'none', imageRendering: 'pixelated' as any }}>
            <rect x="7" y="1" width="2" height="14" fill="var(--p,#c98bad)" />
            <rect x="1" y="7" width="14" height="2" fill="var(--s,#8aa6c4)" />
            <rect x="6" y="6" width="4" height="4" fill="var(--gold,#c9a85f)" />
          </svg>
          <div style={{ minWidth: 0 }}>
            <div className="font-pixel" style={{ fontSize: 'clamp(10px,1.8vw,13px)', color: 'var(--tx,#e4e0ee)' }}>
              ⚙ STEWARD CONSOLE
            </div>
            <div style={{ fontSize: 16, color: 'var(--mu,#9990ab)', marginTop: 8 }}>
              Curriculum · principles · contributors · approvals
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <ReturnBtn />
        </div>
      </div>

      {/* ═══ Body: Sidebar + Main ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>

        {/* ─── Sidebar ─── */}
        <aside style={{
          flex: '1 1 200px',
          minWidth: 190,
          maxWidth: 250,
          border: '2px solid var(--ln,#3d2668)',
          borderRadius: 12,
          background: 'rgba(0,0,0,.22)',
          padding: 12,
        }}>
          <div className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', letterSpacing: 1, margin: '4px 6px 12px' }}>
            • CONSOLE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NavBtn id="cohort" icon="◈" label="Cohort Editing" />
            <NavBtn id="approvals" icon="☑" label="Approvals" count={pendingSubmissions?.length || 0} />
            <NavBtn id="contributors" icon="❀" label="Contributors" count={showcaseList?.length || 0} />
            <NavBtn id="ailabs" icon="⚡" label="AI Labs" />
          </div>
          <div style={{ borderTop: '2px solid var(--ln,#3d2668)', margin: '14px 2px 0', paddingTop: 14 }}>
            <ReturnBtn wide />
          </div>
        </aside>

        {/* ─── Main content area ─── */}
        <div style={{ flex: '3 1 520px', minWidth: 0 }}>

          {/* Sub-tabs for Cohort Editing group */}
          {isCohortEditing && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, padding: '0 2px' }}>
              {([
                { id: 'cohort' as AdminSection, label: 'Cohort Settings' },
                { id: 'curriculum' as AdminSection, label: 'Curriculum' },
                { id: 'principles' as AdminSection, label: 'Principles' },
                { id: 'certificate' as AdminSection, label: 'Certificate' },
              ]).map(tab => {
                const active = section === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSection(tab.id)}
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '9px',
                      fontWeight: 'bold',
                      padding: '12px 16px',
                      border: `2px solid ${active ? 'var(--gold,#ffd23f)' : 'var(--ln,#3d2668)'}`,
                      borderRadius: 8,
                      background: active ? 'var(--gold,#ffd23f)' : 'rgba(0,0,0,.25)',
                      color: active ? '#12081e' : 'var(--tx,#efe6ff)',
                      cursor: 'pointer',
                      boxShadow: active ? '0 0 14px var(--gold,#ffd23f)' : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* ═══════════════ COHORT SETTINGS ═══════════════ */}
          {section === 'cohort' && (
            <div style={{
              border: '2px solid var(--ln,#3a3352)',
              borderRadius: 12,
              background: '#201a30',
              padding: '24px',
              color: 'var(--tx,#e4e0ee)'
            }}>
              <div className="font-pixel" style={{ fontSize: 10, color: 'var(--gold,#ffd23f)', marginBottom: 20 }}>
                ◈ COHORT SETTINGS
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Cohort Name</div>
                  <input
                    defaultValue={cohort?.name || ''}
                    onBlur={e => saveField(() => updateCohort(cohortId, { name: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </div>
                
                <div>
                  <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Description</div>
                  <textarea
                    ref={descRef}
                    defaultValue={initialDesc}
                    onBlur={e => {
                      let finalDesc = e.target.value.trim()
                      if (cohortThumb) finalDesc += `\n<div data-thumbnail="${cohortThumb}" style="display:none;"></div>`
                      saveField(() => updateCohort(cohortId, { description: finalDesc }))
                    }}
                    style={{ ...textareaStyle, minHeight: 80 }}
                  />
                </div>

                <div>
                  <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Thumbnail Image</div>
                  {cohortThumb ? (
                    <div style={{ position: 'relative', display: 'inline-block', border: '2px solid var(--ln,#3d2668)', borderRadius: 8, overflow: 'hidden' }}>
                      <img src={cohortThumb} alt="Thumbnail Preview" style={{ height: 160, objectFit: 'cover' }} />
                      <button
                        onClick={() => {
                          setCohortThumb('')
                          let finalDesc = descRef.current?.value.trim() || ''
                          saveField(() => updateCohort(cohortId, { description: finalDesc }))
                        }}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: '#ff4545', color: '#000', border: 'none', borderRadius: '50%',
                          width: 24, height: 24, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold'
                        }}
                      >✕</button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          const url = await uploadCohortThumbnail(formData)
                          setCohortThumb(url)
                          
                          let finalDesc = descRef.current?.value.trim() || ''
                          if (url) finalDesc += `\n<div data-thumbnail="${url}" style="display:none;"></div>`
                          saveField(() => updateCohort(cohortId, { description: finalDesc }))
                        } catch (err: any) {
                          console.error(err)
                        }
                      }}
                      style={{ ...inputStyle, padding: '12px', fontSize: 14 }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Status</div>
                    <select
                      defaultValue={cohort?.status || 'draft'}
                      onChange={e => saveField(() => updateCohort(cohortId, { status: e.target.value as any }))}
                      style={{ ...inputStyle }}
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ CERTIFICATE SETTINGS ═══════════════ */}
          {section === 'certificate' && (
            <div style={{
              border: '2px solid var(--ln,#3a3352)',
              borderRadius: 12,
              background: '#201a30',
              padding: '18px 19px',
            }}>
              <div className="font-pixel" style={{ fontSize: 14, color: 'var(--gold,#c9a85f)', letterSpacing: 1, marginBottom: 6 }}>
                ⎙ CERTIFICATE
              </div>
              <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)', lineHeight: 1.45, marginBottom: 18 }}>
                Customize the completion certificate so it reflects your real program. Changes save automatically and appear on every student's certificate.
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 14 }}>
                <label style={{ display: 'block' }}>
                  <div className="font-pixel" style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', marginBottom: 8 }}>ORGANIZATION NAME</div>
                  <input
                    type="text"
                    value={certOrg}
                    onChange={e => {
                      console.log('Org changed to:', e.target.value)
                      setCertOrg(e.target.value)
                    }}
                    onBlur={() => {
                      console.log('Saving org:', certOrg)
                      saveCertSettings({ certOrg })
                    }}
                    placeholder="StewardWorks"
                    style={{ ...inputStyle }}
                    autoComplete="off"
                  />
                </label>
                <label style={{ display: 'block' }}>
                  <div className="font-pixel" style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', marginBottom: 8 }}>FACILITATOR NAME</div>
                  <input
                    type="text"
                    value={certFacilitator}
                    onChange={e => {
                      console.log('Facilitator changed to:', e.target.value)
                      setCertFacilitator(e.target.value)
                    }}
                    onBlur={() => {
                      console.log('Saving facilitator:', certFacilitator)
                      saveCertSettings({ certFacilitator })
                    }}
                    placeholder="Marisol Vega"
                    style={{ ...inputStyle }}
                    autoComplete="off"
                  />
                </label>
                <label style={{ display: 'block' }}>
                  <div className="font-pixel" style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', marginBottom: 8 }}>FACILITATOR TITLE</div>
                  <input
                    type="text"
                    value={certFacTitle}
                    onChange={e => {
                      console.log('Title changed to:', e.target.value)
                      setCertFacTitle(e.target.value)
                    }}
                    onBlur={() => {
                      console.log('Saving title:', certFacTitle)
                      saveCertSettings({ certFacTitle })
                    }}
                    placeholder="Lead Steward"
                    style={{ ...inputStyle }}
                    autoComplete="off"
                  />
                </label>
                <label style={{ display: 'block' }}>
                  <div className="font-pixel" style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', marginBottom: 8 }}>FISCAL SPONSOR SIGNER</div>
                  <input
                    type="text"
                    value={certSponsor}
                    onChange={e => {
                      console.log('Sponsor changed to:', e.target.value)
                      setCertSponsor(e.target.value)
                    }}
                    onBlur={() => {
                      console.log('Saving sponsor:', certSponsor)
                      saveCertSettings({ certSponsor })
                    }}
                    placeholder="Signer name"
                    style={{ ...inputStyle }}
                    autoComplete="off"
                  />
                </label>
                <label style={{ display: 'block' }}>
                  <div className="font-pixel" style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', marginBottom: 8 }}>FISCAL SPONSOR ORG</div>
                  <input
                    type="text"
                    value={certSponsorOrg}
                    onChange={e => {
                      console.log('Sponsor org changed to:', e.target.value)
                      setCertSponsorOrg(e.target.value)
                    }}
                    onBlur={() => {
                      console.log('Saving sponsor org:', certSponsorOrg)
                      saveCertSettings({ certSponsorOrg })
                    }}
                    placeholder="The Becoming Project"
                    style={{ ...inputStyle }}
                    autoComplete="off"
                  />
                </label>
              </div>

              <label style={{ display: 'block', marginBottom: 16 }}>
                <div className="font-pixel" style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', marginBottom: 8 }}>
                  CERTIFICATE WORDING <span style={{ color: 'var(--mu,#9990ab)', fontFamily: "'Inter', sans-serif", fontSize: 13, textTransform: 'normal', letterSpacing: 'normal' }}>· leave blank for the default</span>
                </div>
                <textarea
                  value={certMessage}
                  onChange={e => {
                    console.log('Message changed to:', e.target.value)
                    setCertMessage(e.target.value)
                  }}
                  onBlur={() => {
                    console.log('Saving message:', certMessage)
                    saveCertSettings({ certMessage })
                  }}
                  rows={4}
                  placeholder="has completed the full three-day intensive of The Steward's Journey…"
                  style={{ ...textareaStyle, minHeight: 100 }}
                />
              </label>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <button
                  onClick={() => saveCertSettings({})}
                  disabled={certSaving}
                  className="font-pixel"
                  style={{ 
                    fontSize: 9, 
                    color: '#141019', 
                    background: certSaving ? '#8a7a4f' : 'var(--ok,#74f0a0)', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '11px 15px', 
                    cursor: certSaving ? 'wait' : 'pointer',
                    opacity: certSaving ? 0.7 : 1
                  }}
                >
                  {certSaving ? '✓ SAVING...' : '✓ SAVE SETTINGS'}
                </button>
                <button
                  onClick={async () => {
                    await refreshCertSettings()
                    setShowCertPreview(true)
                  }}
                  className="font-pixel"
                  style={{ fontSize: 9, color: '#141019', background: 'var(--gold,#c9a85f)', border: 'none', borderRadius: 6, padding: '11px 15px', cursor: 'pointer' }}
                >
                  ◆ PREVIEW CERTIFICATE
                </button>
                <span style={{ fontSize: 14, color: 'var(--mu,#9990ab)' }}>
                  {certSaving ? 'Saving to database...' : 'Changes save on blur or click Save'}
                </span>
              </div>
            </div>
          )}

          {/* ═══════════════ CURRICULUM ═══════════════ */}
          {section === 'curriculum' && (
            <>
              {/* Day tabs */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {daysData.map((d: any, i: number) => {
                  const isActive = i === activeDayIdx;
                  return (
                    <button
                      key={d.id}
                      onClick={() => { setActiveDayIdx(i); setSelectedEntry(null) }}
                      className="font-pixel"
                      style={{
                        fontSize: 14,
                        padding: '12px 16px',
                        border: `2px solid ${isActive ? '#ffd23f' : 'var(--ln,#3d2668)'}`,
                        borderRadius: 4,
                        background: isActive ? '#ffd23f' : 'transparent',
                        color: isActive ? '#12081e' : 'var(--mu,#a493c9)',
                        boxShadow: isActive ? `0 0 16px #ffd23f` : 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      DAY {String(d.day_number).padStart(2, '0')}
                    </button>
                  );
                })}
                
                {/* ADD DAY BUTTON */}
                <button
                  onClick={handleAddDay}
                  className="font-pixel"
                  style={{
                    fontSize: 14,
                    padding: '12px 16px',
                    border: '2px dashed var(--s,#45d6ff)',
                    borderRadius: 4,
                    background: 'transparent',
                    color: 'var(--s,#45d6ff)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + ADD DAY
                </button>
              </div>

              {activeDay && (
                <div key={activeDay.id} style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  overflow: 'hidden',
                  border: '2px solid var(--ln,#3d2668)',
                  borderRadius: 12,
                  background: 'var(--pn,#241542)',
                }}>
                  {/* LEFT: session list */}
                  <div style={{
                    flex: '1 1 300px',
                    minWidth: 250,
                    maxWidth: 380,
                    borderRight: '2px solid var(--ln,#3d2668)',
                    background: 'rgba(0,0,0,.16)',
                    padding: '20px 18px',
                  }}>
                    <div className="font-pixel" style={{ fontSize: 12, color: 'var(--gold,#ffd23f)', margin: '2px 4px 8px', letterSpacing: 1 }}>
                      DAY {String(activeDay.day_number).padStart(2, '0')} · WORKSHOP DAY
                    </div>
                    <input
                      defaultValue={activeDay.title}
                      placeholder="Day title…"
                      onBlur={e => handleDayFieldBlur(activeDay.id, 'title', e.target.value)}
                      style={{ ...inputStyle, fontSize: 16, lineHeight: 1.5, marginBottom: 8 }}
                    />
                    <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Short blurb — map & day header</div>
                    <textarea
                      defaultValue={activeDay.content_body || activeDay.blurb || ''}
                      rows={2}
                      placeholder="Short intro shown on the map & day header…"
                      onBlur={e => handleDayFieldBlur(activeDay.id, 'content_body', e.target.value)}
                      style={{ ...textareaStyle, marginBottom: 12 }}
                    />
                    <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>
                      ◈ Level intro — the card shown when a steward enters this day's scene
                    </div>
                    <textarea
                      defaultValue={activeDay.intro || ''}
                      rows={4}
                      placeholder="Set the scene: what act is this, what will they gather…"
                      onBlur={e => handleDayFieldBlur(activeDay.id, 'intro', e.target.value)}
                      style={{ ...textareaStyle, borderColor: 'var(--gold,#ffd23f)', marginBottom: 15 }}
                    />
                    <div className="font-vt323" style={{
                      fontSize: 16,
                      color: 'var(--mu,#a493c9)',
                      borderTop: '1px dashed var(--ln,#3d2668)',
                      paddingTop: 11,
                      margin: '0 2px 12px',
                      lineHeight: 1.4,
                    }}>
                      Each session below is an <span style={{ color: 'var(--gold,#ffd23f)' }}>artifact</span> the steward walks up to in this day's scene.
                    </div>

                    {/* Section list */}
                    {(activeDay.sections || []).map((sec: any, si: number) => (
                      <div key={sec.id || si} style={{ marginBottom: 16 }}>
                        <div style={{
                          border: '2px solid var(--ln,#3d2668)',
                          borderRadius: 8,
                          background: 'rgba(0,0,0,.28)',
                          padding: '9px 10px',
                          marginBottom: 9,
                        }}>
                          <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>◇ SESSION HEADER</span>
                            <button onClick={() => handleDeleteSection(sec.id, activeDay.id)} style={{ fontSize: 14, color: '#cf9760', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }} title="Delete section">✕</button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <input
                              defaultValue={sec.hour}
                              placeholder="HOUR A"
                              onBlur={e => handleSectionFieldBlur(sec.id, 'hour', e.target.value)}
                              style={{ ...inputStyle, flex: 1, minWidth: 0, color: 'var(--gold,#ffd23f)', fontSize: 15, padding: 8, letterSpacing: '.5px' }}
                            />
                            <input
                              defaultValue={sec.duration}
                              placeholder="1 hr"
                              onBlur={e => handleSectionFieldBlur(sec.id, 'duration', e.target.value)}
                              style={{ ...inputStyle, width: 62, flex: 'none', fontSize: 15, padding: 8, textAlign: 'center' }}
                            />
                          </div>
                          <input
                            defaultValue={sec.title}
                            placeholder="Session title…"
                            onBlur={e => handleSectionFieldBlur(sec.id, 'title', e.target.value)}
                            style={{ ...inputStyle, fontSize: 16, padding: '8px 9px' }}
                          />
                        </div>

                        {/* Entries */}
                        {(sec.entries || []).map((en: any, ei: number) => (
                          <div key={en.id || ei} style={{ display: 'flex', alignItems: 'stretch', gap: 6, marginBottom: 8 }}>
                            <button
                              onClick={() => { setSelectedEntry(en.id); setEditorOpen(true); }}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '9px 10px',
                                border: `2px solid ${selectedEntry === en.id ? 'var(--gold,#c9a85f)' : 'var(--ln,#3d2668)'}`,
                                borderRadius: 8,
                                background: selectedEntry === en.id ? 'rgba(201,168,95,.1)' : 'rgba(0,0,0,.15)',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span className="font-pixel" style={{
                                fontSize: 12,
                                color: 'var(--gold,#ffd23f)',
                                background: 'rgba(0,0,0,.3)',
                                borderRadius: 4,
                                padding: '6px 8px',
                                flex: 'none',
                              }}>
                                {si + 1}.{ei + 1}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 17, color: 'var(--tx,#efe6ff)', lineHeight: 1.15 }}>{en.title}</div>
                                <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu,#a493c9)', marginTop: 5, lineHeight: 1.5 }}>
                                  {en.subtitle || en.entry_type}
                                </div>
                              </div>
                              <span style={{ color: 'var(--mu,#a493c9)', fontSize: 18 }}>›</span>
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(en.id, sec.id)}
                              style={{ fontSize: 14, color: '#cf9760', background: 'rgba(0,0,0,.2)', border: '1px solid #5a4636', borderRadius: 6, padding: '0 8px', cursor: 'pointer', flex: 'none' }}
                              title="Delete entry"
                            >✕</button>
                          </div>
                        ))}

                        <button
                          onClick={() => handleAddEntry(sec.id)}
                          className="font-pixel"
                          style={{
                            fontSize: 10,
                            color: 'var(--p,#ff5fd2)',
                            background: 'none',
                            border: '2px dashed var(--p,#ff5fd2)',
                            borderRadius: 6,
                            padding: '9px 11px',
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: 2,
                          }}
                        >
                          ＋ ADD LESSON SLOT
                        </button>
                      </div>
                    ))}

                    {/* Add Section button */}
                    <button
                      onClick={() => handleAddSection(activeDay.id)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        color: 'var(--s,#45d6ff)',
                        background: 'none',
                        border: '2px dashed var(--s,#45d6ff)',
                        borderRadius: 6,
                        padding: '11px',
                        cursor: 'pointer',
                        width: '100%',
                        marginTop: 8,
                      }}
                    >
                      ＋ ADD SESSION
                    </button>
                  </div>

                  {/* RIGHT: selected session summary */}
                  <div style={{
                    flex: '2 1 320px',
                    minWidth: 260,
                    padding: 'clamp(16px,2.6vw,26px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div className="font-pixel" style={{ fontSize: 8, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>
                        {selEntry ? `SESSION ${selEntry.num}` : 'SELECT A SESSION'}
                      </div>
                      <span className="font-pixel" style={{
                        fontSize: 7,
                        color: isSaving ? 'var(--gold,#c9a85f)' : 'var(--ok,#74f0a0)',
                        border: `1px solid ${isSaving ? 'var(--gold,#c9a85f)' : 'var(--ok,#74f0a0)'}`,
                        borderRadius: 20,
                        padding: '4px 9px',
                      }}>
                        {isSaving ? '○ SAVING…' : '● SAVES LIVE'}
                      </span>
                    </div>

                    {selEntry && (
                      <div style={{
                        border: '2px solid var(--ln,#3d2668)',
                        borderRadius: 12,
                        background: 'rgba(0,0,0,.2)',
                        padding: '18px 16px',
                      }}>
                        <span className="font-pixel" style={{
                          fontSize: 7,
                          color: '#141019',
                          background: 'var(--gold,#ffd23f)',
                          borderRadius: 20,
                          padding: '5px 10px',
                        }}>
                          {(selEntry.entry_type || 'text').toUpperCase()}
                        </span>
                        <div className="font-pixel" style={{ fontSize: 12, color: 'var(--tx,#efe6ff)', lineHeight: 1.5, margin: '12px 0 8px' }}>
                          {selEntry.title}
                        </div>
                        <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', marginBottom: 16 }}>
                          {selEntry.subtitle}
                        </div>
                        <button
                          onClick={() => setEditorOpen(true)}
                          className="font-pixel"
                          style={{
                            fontSize: 9,
                            color: '#141019',
                            background: 'var(--ok,#74f0a0)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '13px 15px',
                            cursor: 'pointer',
                            width: '100%',
                            boxShadow: '0 3px 0 rgba(0,0,0,.3)',
                          }}
                        >
                          ✎ OPEN SESSION EDITOR ⤢
                        </button>
                        <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginTop: 12, lineHeight: 1.45 }}>
                          Opens a spacious editor — rich text on the left with matching photos, video & links on the right, just like the student's session pop-up.
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', lineHeight: 1.4 }}>
                      Click any session on the left to edit it. Every session supports rich text and media.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════ PRINCIPLES ═══════════════ */}
          {section === 'principles' && (
            <div style={{
              border: '2px solid var(--ln,#3a3352)',
              borderRadius: 12,
              background: '#201a30',
              padding: '17px 18px',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, justifyContent: 'space-between', marginBottom: 6 }}>
                <div className="font-pixel" style={{ fontSize: 9, color: 'var(--tx,#e4e0ee)', letterSpacing: 1 }}>
                  ◉ PRINCIPLE LIBRARY
                </div>
                <div style={{ fontFamily: "'VT323'", fontSize: 15, letterSpacing: '.5px', color: 'var(--s,#8aa6c4)', border: '1px solid var(--ln,#3a3352)', borderRadius: 20, padding: '2px 11px' }}>
                  ⟳ synced to the AI Lab
                </div>
              </div>
              <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)', lineHeight: 1.45, marginBottom: 16, maxWidth: 640 }}>
                The shared rubric both consoles edit. Every principle here appears in the Lab's validator & in the student's deliverable picker.
              </div>

              {/* Existing principles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
                {principlesList.map((pr) => (
                  <div key={pr.id} style={{
                    border: '2px solid var(--ln,#3a3352)',
                    borderRadius: 10,
                    background: 'var(--pn,#201a30)',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setOpenPrinciple(openPrinciple === pr.id ? null : pr.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '12px 14px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{
                        width: 22,
                        height: 22,
                        flex: 'none',
                        borderRadius: 5,
                        background: '#2a2340',
                        border: '1px solid var(--ln,#3a3352)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Press Start 2P'",
                        fontSize: 8,
                        color: 'var(--p,#c98bad)',
                      }}>◈</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 18, color: 'var(--tx,#e4e0ee)', lineHeight: 1.2 }}>
                        {pr.name}
                      </span>
                      <span style={{
                        fontSize: 18,
                        color: 'var(--mu,#9990ab)',
                        transform: openPrinciple === pr.id ? 'rotate(90deg)' : 'none',
                        transition: 'transform .2s',
                      }}>▸</span>
                    </button>
                    {openPrinciple === pr.id && (
                      <div style={{ padding: '2px 14px 15px', display: 'flex', flexDirection: 'column', gap: 11, borderTop: '1px dashed var(--ln,#3a3352)' }}>
                        <div>
                          <div style={{ fontFamily: "'VT323'", fontSize: 14, letterSpacing: 1, color: 'var(--mu,#9990ab)', margin: '11px 0 5px' }}>NAME</div>
                          <input defaultValue={pr.name} onBlur={e => handleUpdatePrinciple(pr.id, 'name', e.target.value)} style={{ ...inputStyle, background: 'var(--bg,#140f1e)' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'VT323'", fontSize: 14, letterSpacing: 1, color: 'var(--mu,#9990ab)', marginBottom: 5 }}>DESCRIPTION</div>
                          <textarea defaultValue={pr.description || ''} placeholder="What does this principle mean?" onBlur={e => handleUpdatePrinciple(pr.id, 'description', e.target.value)} style={{ ...textareaStyle, minHeight: 56, background: 'var(--bg,#140f1e)' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'VT323'", fontSize: 14, letterSpacing: 1, color: 'var(--mu,#9990ab)', marginBottom: 5 }}>
                            EXAMPLE <span style={{ opacity: .7 }}>· shown as a tip in the Lab</span>
                          </div>
                          <textarea defaultValue={pr.example || ''} placeholder="A concrete example students can follow…" onBlur={e => handleUpdatePrinciple(pr.id, 'example', e.target.value)} style={{ ...textareaStyle, minHeight: 48, background: 'var(--bg,#140f1e)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleDeletePrinciple(pr.id)}
                            style={{
                              fontFamily: "'VT323'",
                              fontSize: 15,
                              letterSpacing: '.5px',
                              color: '#cf9760',
                              background: 'none',
                              border: '2px solid #5a4636',
                              borderRadius: 5,
                              padding: '5px 12px',
                              cursor: 'pointer',
                            }}
                          >✕ REMOVE</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new principle */}
              <div style={{
                border: '2px dashed var(--ln,#3a3352)',
                borderRadius: 9,
                padding: '14px 15px',
                background: 'var(--bg,#140f1e)',
              }}>
                <div className="font-pixel" style={{ fontSize: 8, color: 'var(--p,#c98bad)', letterSpacing: 1, marginBottom: 12 }}>
                  ＋ ADD PRINCIPLE
                </div>
                <input
                  value={newPrName}
                  onChange={e => setNewPrName(e.target.value)}
                  placeholder="Principle name (e.g. Local & Land-based)…"
                  style={{ ...inputStyle, background: '#201a30', marginBottom: 9 }}
                />
                <textarea
                  value={newPrDesc}
                  onChange={e => setNewPrDesc(e.target.value)}
                  placeholder="Description…"
                  style={{ ...textareaStyle, minHeight: 48, background: '#201a30', marginBottom: 9 }}
                />
                <textarea
                  value={newPrExample}
                  onChange={e => setNewPrExample(e.target.value)}
                  placeholder="Example (optional)…"
                  style={{ ...textareaStyle, minHeight: 44, background: '#201a30', marginBottom: 12 }}
                />
                <button
                  onClick={handleAddPrinciple}
                  disabled={isSaving || !newPrName.trim()}
                  className="font-pixel"
                  style={{
                    fontSize: 12,
                    color: '#141019',
                    background: (isSaving || !newPrName.trim()) ? 'var(--mu,#a493c9)' : 'var(--ok,#86b89a)',
                    border: 'none',
                    borderRadius: 5,
                    padding: '11px 14px',
                    cursor: (isSaving || !newPrName.trim()) ? 'not-allowed' : 'pointer',
                    width: '100%',
                    opacity: (isSaving || !newPrName.trim()) ? 0.7 : 1
                  }}
                >
                  {isSaving && newPrName.trim() ? 'ADDING...' : 'ADD → SYNC TO LAB'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════ CONTRIBUTORS ═══════════════ */}
          {section === 'contributors' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18, alignItems: 'start' }}>
              {/* Publish form */}
              <div style={{
                border: '2px solid var(--ok,#74f0a0)',
                borderRadius: 8,
                padding: 15,
                background: 'rgba(116,240,160,.05)',
                height: 'fit-content',
              }}>
                <div className="font-pixel" style={{ fontSize: 9, color: 'var(--ok,#74f0a0)', marginBottom: 13 }}>
                  {editingShowcaseId ? '✎ EDIT CONTRIBUTOR MEDIA' : '＋ PUBLISH CONTRIBUTOR MEDIA'}
                </div>
                <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 7 }}>MEDIA TYPE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['video', 'article', 'audio', 'aigen'].map(t => (
                    <button
                      key={t}
                      onClick={() => setNcType(t)}
                      className="font-pixel"
                      style={{
                        fontSize: 14,
                        padding: '8px 12px',
                        border: `2px solid ${ncType === t ? 'var(--ok,#74f0a0)' : 'var(--ln,#3d2668)'}`,
                        borderRadius: 6,
                        background: ncType === t ? 'rgba(116,240,160,.15)' : 'rgba(0,0,0,.3)',
                        color: ncType === t ? 'var(--ok,#74f0a0)' : 'var(--mu,#a493c9)',
                        cursor: 'pointer',
                      }}
                    >
                      {t === 'aigen' ? 'AI GEN' : t.toUpperCase()}
                    </button>
                  ))}
                </div>
                <input value={ncTitle} onChange={e => setNcTitle(e.target.value)} placeholder="Media title…" style={{ ...inputStyle, fontSize: 18, marginBottom: 9 }} />
                <input value={ncAuthor} onChange={e => setNcAuthor(e.target.value)} placeholder="Contributor name…" style={{ ...inputStyle, fontSize: 18, marginBottom: 9 }} />
                <div style={{ marginBottom: 9 }}>
                  <input 
                    value={ncEmail} 
                    onChange={e => setNcEmail(e.target.value)} 
                    placeholder="Contributor email (optional)…" 
                    type="email" 
                    style={{ ...inputStyle, fontSize: 18, marginBottom: 4 }} 
                  />
                  <div style={{ fontSize: 12, color: 'var(--s,#8aa6c4)', paddingLeft: 4, lineHeight: 1.3 }}>
                    ✉ When provided, sends an invitation email with guest access
                  </div>
                </div>
                <input value={ncLink} onChange={e => setNcLink(e.target.value)} placeholder="Public share link / creation ID…" style={{ ...inputStyle, fontSize: 18, marginBottom: 9 }} />
                <input value={ncMeta} onChange={e => setNcMeta(e.target.value)} placeholder="Duration / word count (e.g., 8:24 · Video)…" style={{ ...inputStyle, fontSize: 18, marginBottom: 9 }} />
                <textarea 
                  value={ncBlurb} 
                  onChange={e => setNcBlurb(e.target.value)} 
                  placeholder="Description / blurb for students…" 
                  rows={3}
                  style={{ ...textareaStyle, fontSize: 16, marginBottom: 12 }} 
                />
                <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>
                  CONTRIBUTOR STATUS · <span style={{ opacity: .75 }}>admin-only, hidden from students</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <button
                    onClick={() => setNcPaid(true)}
                    className="font-pixel"
                    style={{
                      fontSize: 11,
                      padding: '8px 14px',
                      border: `2px solid ${ncPaid ? 'var(--gold,#c9a85f)' : 'var(--ln,#3d2668)'}`,
                      borderRadius: 6,
                      background: ncPaid ? 'rgba(201,168,95,.15)' : 'rgba(0,0,0,.3)',
                      color: ncPaid ? 'var(--gold,#c9a85f)' : 'var(--mu,#a493c9)',
                      cursor: 'pointer',
                    }}
                  >✦ PAID</button>
                  <button
                    onClick={() => setNcPaid(false)}
                    className="font-pixel"
                    style={{
                      fontSize: 11,
                      padding: '8px 14px',
                      border: `2px solid ${!ncPaid ? 'var(--ok,#74f0a0)' : 'var(--ln,#3d2668)'}`,
                      borderRadius: 6,
                      background: !ncPaid ? 'rgba(116,240,160,.1)' : 'rgba(0,0,0,.3)',
                      color: !ncPaid ? 'var(--ok,#74f0a0)' : 'var(--mu,#a493c9)',
                      cursor: 'pointer',
                    }}
                  >FREE</button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginBottom: 13, lineHeight: 1.4 }}>
                  Files into the Steward Library under <span style={{ color: 'var(--s,#45d6ff)' }}>◈ How to Use AI</span> and appears in the student Showcase (no price shown).
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handlePublishContributor}
                    disabled={isSaving || !ncTitle.trim()}
                    className="font-pixel"
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: 'var(--bg,#12081e)',
                      background: isSaving || !ncTitle.trim() ? 'var(--mu,#a493c9)' : 'var(--ok,#74f0a0)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '11px 14px',
                      cursor: isSaving || !ncTitle.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSaving ? 'SAVING…' : editingShowcaseId ? '✓ UPDATE' : 'PUBLISH → HOW TO USE AI'}
                  </button>
                  {editingShowcaseId && (
                    <button
                      onClick={handleCancelEdit}
                      className="font-pixel"
                      style={{
                        fontSize: 11,
                        color: 'var(--mu,#a493c9)',
                        background: 'transparent',
                        border: '2px solid var(--mu,#a493c9)',
                        borderRadius: 4,
                        padding: '11px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </div>

              {/* Published list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '0 2px'
                }}>
                  <div style={{ fontFamily: "'VT323'", fontSize: 15, letterSpacing: 1, color: 'var(--mu,#9990ab)' }}>
                    PUBLISHED · HOW TO USE AI ({(showcaseList || []).length})
                  </div>
                  {(showcaseList || []).length === 0 && (
                    <button
                      onClick={handleSeedShowcase}
                      disabled={isSaving}
                      className="font-pixel"
                      style={{
                        fontSize: 7,
                        padding: '6px 10px',
                        borderRadius: 4,
                        border: '2px solid var(--ok,#74f0a0)',
                        background: isSaving ? 'var(--mu,#a493c9)' : 'transparent',
                        color: isSaving ? '#12081e' : 'var(--ok,#74f0a0)',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isSaving ? 'SEEDING...' : '+ SEED SAMPLES'}
                    </button>
                  )}
                </div>
                {(showcaseList || []).length === 0 ? (
                  <div style={{
                    border: '2px dashed var(--ln,#3a3352)',
                    borderRadius: 9,
                    padding: '20px',
                    background: 'var(--pn,#201a30)',
                    textAlign: 'center',
                    color: 'var(--mu,#9990ab)',
                    fontSize: 15,
                  }}>
                    No published items yet. Add your first contributor media above.
                  </div>
                ) : (
                  (showcaseList || []).map((item) => (
                    <div key={item.id} style={{
                      border: '2px solid var(--ln,#3a3352)',
                      borderRadius: 9,
                      padding: '14px 16px',
                      background: 'var(--pn,#201a30)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 4,
                        background: item.type === 'video' ? '#45d6ff' : item.type === 'article' ? '#ffd23f' : item.type === 'audio' ? '#ff5fd2' : '#74f0a0',
                        flex: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: '#12081e',
                      }}>
                        {item.type === 'video' ? '▶' : item.type === 'article' ? '✎' : item.type === 'audio' ? '♫' : '✦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 18, color: 'var(--tx,#e4e0ee)', lineHeight: 1.25 }}>{item.title}</div>
                        <div style={{ fontSize: 14, color: 'var(--mu,#9990ab)', marginTop: 3 }}>
                          {item.type.toUpperCase()} · {item.author || 'Anonymous'}
                          {item.is_paid && <span style={{ marginLeft: 8, color: 'var(--gold,#c9a85f)' }}>★ PAID</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditShowcase(item)}
                        title="Edit"
                        style={{
                          flex: 'none',
                          background: 'none',
                          border: 'none',
                          color: 'var(--gold,#ffd23f)',
                          fontSize: 16,
                          cursor: 'pointer',
                          lineHeight: 1,
                          padding: '4px 8px',
                        }}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteShowcase(item.id)}
                        title="Delete"
                        style={{
                          flex: 'none',
                          background: 'none',
                          border: 'none',
                          color: 'var(--mu,#a493c9)',
                          fontSize: 16,
                          cursor: 'pointer',
                          lineHeight: 1,
                          padding: '4px 8px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ APPROVALS ═══════════════ */}
          {section === 'approvals' && (
            <div style={{
              border: '2px solid var(--ln,#3a3352)',
              borderRadius: 12,
              background: '#201a30',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-pixel" style={{ fontSize: 13, color: 'var(--tx,#e4e0ee)', letterSpacing: 1 }}>
                    ☑ APPROVALS
                  </div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: 'var(--mu,#9990ab)', marginTop: 8, maxWidth: 560, lineHeight: 1.45 }}>
                    Grow each learner's Chia Guardian. <span style={{ color: '#c9a85f' }}>Deliverables</span> add 25% (max 75%); <span style={{ color: '#86b89a' }}>engagement</span> adds 1–3% (max 25%). Read the queue as a <strong>log</strong> or by <strong>steward</strong>.
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, flex: 'none' }}>
                  <span style={{
                    fontFamily: "'VT323'",
                    fontSize: 18,
                    letterSpacing: '.5px',
                    color: '#141019',
                    background: 'var(--gold,#c9a85f)',
                    borderRadius: 20,
                    padding: '4px 14px',
                  }}>{pendingSubmissions.length} PENDING</span>
                  <div style={{ display: 'flex', gap: 3, border: '2px solid var(--ln,#3a3352)', borderRadius: 7, padding: 3, background: '#181324' }}>
                    <button
                      onClick={() => setApprovalView('log')}
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '8px',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 5,
                        background: approvalView === 'log' ? 'var(--gold,#ffd23f)' : 'transparent',
                        color: approvalView === 'log' ? '#12081e' : 'var(--tx,#e4e0ee)',
                        cursor: 'pointer',
                      }}
                    >▤ LOG</button>
                    <button
                      onClick={() => setApprovalView('steward')}
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '8px',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 5,
                        background: approvalView === 'steward' ? 'var(--gold,#ffd23f)' : 'transparent',
                        color: approvalView === 'steward' ? '#12081e' : 'var(--tx,#e4e0ee)',
                        cursor: 'pointer',
                      }}
                    >◱ BY STEWARD</button>
                  </div>
                </div>
              </div>

              {/* Filter chips */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                borderTop: '1px dashed var(--ln,#3a3352)',
                borderBottom: '1px dashed var(--ln,#3a3352)',
                padding: '12px 0',
              }}>
                {[
                  { id: 'all', label: 'ALL', color: 'var(--tx,#e4e0ee)', count: pendingSubmissions.length },
                  { id: 'deliverables', label: 'DELIVERABLES', color: 'var(--gold,#c9a85f)', count: pendingSubmissions.filter(s => !!s.workshop_day_id).length },
                  { id: 'engagement', label: 'ENGAGEMENT', color: 'var(--ok,#86b89a)', count: pendingSubmissions.filter(s => !s.workshop_day_id).length }
                ].map(f => {
                  const active = approvalFilter === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => setApprovalFilter(f.id)}
                      style={{
                        fontFamily: "'VT323', monospace",
                        fontSize: 18,
                        letterSpacing: '.5px',
                        padding: '6px 14px',
                        border: `1px solid ${active ? f.color : 'var(--ln,#3a3352)'}`,
                        borderRadius: 20,
                        background: active ? 'rgba(255,255,255,.05)' : 'transparent',
                        color: active ? f.color : 'var(--mu,#9990ab)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {f.label} {f.count}
                    </button>
                  )
                })}
              </div>

              {/* Approvals List or Empty State */}
              {isLoadingApprovals ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu,#9990ab)' }}>Loading approvals...</div>
              ) : pendingSubmissions.length === 0 ? (
                <div style={{
                  border: '2px dashed var(--ln,#3a3352)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                  fontSize: 15,
                  color: 'var(--mu,#9990ab)',
                }}>
                  All caught up — nothing matches this filter. When students submit deliverables or engagement items, they will appear here for your review.
                </div>
              ) : (
                <>
                {/* LOG VIEW */}
                {approvalView === 'log' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingSubmissions.filter(sub => {
                    if (approvalFilter === 'deliverables') return !!sub.workshop_day_id
                    if (approvalFilter === 'engagement') return !sub.workshop_day_id
                    return true
                  }).length === 0 ? (
                    <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 16, color: 'var(--mu,#9990ab)' }}>
                      All caught up — nothing matches this filter.
                    </div>
                  ) : pendingSubmissions.filter(sub => {
                    if (approvalFilter === 'deliverables') return !!sub.workshop_day_id
                    if (approvalFilter === 'engagement') return !sub.workshop_day_id
                    return true
                  }).map(sub => {
                    const isDeliverable = !!sub.workshop_day_id
                    const tagColor = isDeliverable ? '#c9a85f' : '#86b89a'
                    const tagLabel = isDeliverable ? 'DELIVERABLE' : 'ENGAGEMENT'
                    const approveLabel = isDeliverable ? '✓ APPROVE +25%' : '✓ APPROVE'
                    
                    const studentName = sub.participant_name || 'Unknown Student'
                    const dateStr = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown Date'
                    const subtitle = isDeliverable
                      ? `${studentName} · Day ${sub.day_number} deliverable · ${dateStr}`
                      : `${studentName} · ${sub.source || 'Engagement'} · ${dateStr}`
                    const title = isDeliverable ? (sub.day_title || `Day ${sub.day_number}`) : (sub.title || 'Engagement Item')
                    const reviewId = sub.progress_id || sub.id

                    return (
                      <div key={reviewId} style={{
                        border: '1px solid var(--ln,#3a3352)',
                        borderLeft: `4px solid ${tagColor}`,
                        borderRadius: 8,
                        background: '#181324',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}>
                        
                        {/* Top row: Tag, Title, Subtitle, and Pending */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                            <div className="font-pixel" style={{
                              fontSize: 9,
                              color: tagColor,
                              border: `1px solid ${tagColor}`,
                              borderRadius: 20,
                              padding: '5px 10px',
                              letterSpacing: 1,
                              flex: 'none',
                              marginTop: 4
                            }}>
                              {tagLabel}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                              <div style={{ fontFamily: "'VT323', monospace", fontSize: 20, color: 'var(--tx,#e4e0ee)', letterSpacing: 0.5, lineHeight: 1.1 }}>
                                {title}
                              </div>
                              <div style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: 'var(--mu,#9990ab)', lineHeight: 1.1 }}>
                                {subtitle}
                              </div>
                            </div>
                          </div>
                          
                          {(() => {
                            const rawText = sub.content || sub.submission_text || '';
                            const isShowcaseRequested = rawText.includes('[SHOWCASE_REQUESTED]');
                            let cleanText = rawText.replace('[SHOWCASE_REQUESTED]', '').trim();
                            
                            // Get principle from sub.principle_id (fetched from database)
                            let principleName = '';
                            if (sub.principle_id) {
                              const found = principlesList?.find(p => p.id === sub.principle_id);
                              principleName = found ? found.name : `Principle ${sub.principle_id.slice(0,4)}`;
                            }
                            
                            // Also check old format in submission_text for backward compatibility
                            if (!principleName) {
                              let principleMatch = cleanText.match(/Selected Principle ID: ([a-zA-Z0-9-]+)/);
                              if (principleMatch) {
                                const pId = principleMatch[1];
                                const found = principlesList?.find(p => p.id === pId);
                                principleName = found ? found.name : `Principle ${pId.slice(0,4)}`;
                                cleanText = cleanText.replace(principleMatch[0], '').trim();
                              }
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                                {/* Badges */}
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  <div className="font-pixel" style={{
                                    fontSize: 9,
                                    color: '#c9a85f',
                                    border: '1px solid #c9a85f',
                                    borderRadius: 20,
                                    padding: '5px 10px',
                                    letterSpacing: 1,
                                    marginTop: 4
                                  }}>
                                    PENDING
                                  </div>
                                  
                                  {principleName && (
                                    <div className="font-pixel" style={{
                                      fontSize: 9, color: 'var(--ok,#74f0a0)', border: '1px solid var(--ok,#74f0a0)',
                                      borderRadius: 20, padding: '5px 10px', letterSpacing: 1, marginTop: 4
                                    }}>
                                      ◈ {principleName.toUpperCase()}
                                    </div>
                                  )}
                                  
                                  {isShowcaseRequested && (
                                    <div className="font-pixel" style={{
                                      fontSize: 9, color: '#101613', border: 'none',
                                      borderRadius: 20, padding: '5px 10px', letterSpacing: 1, marginTop: 4,
                                      background: 'var(--pk,#ff5fd2)',
                                      display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                      <span style={{ fontSize: 10 }}>↺</span> WANTS SHOWCASE
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Content/URL display with proper wrapping */}
                        {(() => {
                          const rawText = sub.content || sub.submission_text || '';
                          let cleanText = rawText.replace('[SHOWCASE_REQUESTED]', '').trim();
                          let principleMatch = cleanText.match(/Selected Principle ID: ([a-zA-Z0-9-]+)/);
                          if (principleMatch) {
                            cleanText = cleanText.replace(principleMatch[0], '').trim();
                          }
                          
                          if (!sub.url && !cleanText) return null;

                          return (
                            <div style={{ 
                              fontFamily: "'VT323', monospace", 
                              fontSize: 15, 
                              color: 'var(--tx,#e4e0ee)', 
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              lineHeight: 1.3,
                              padding: '8px 0'
                            }}>
                              {sub.url ? (
                                (sub.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || sub.url.includes('/public/content-uploads/')) ? (
                                  <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                      <img src={sub.url} alt="Submission" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 6, objectFit: 'contain', border: '1px solid var(--ln,#3a3352)', background: 'rgba(0,0,0,.3)' }} />
                                      <div className="font-pixel" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)', color: 'var(--cy,#45d6ff)', border: '1px solid var(--cy,#45d6ff)', padding: '4px 6px', borderRadius: 4, fontSize: 8, letterSpacing: 1 }}>
                                        ↗ OPEN
                                      </div>
                                    </a>
                                  </div>
                                ) : (
                                  <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ color: '#45d6ff', textDecoration: 'underline' }}>
                                    {sub.url} ↗
                                  </a>
                                )
                              ) : (
                                cleanText
                              )}
                            </div>
                          );
                        })()}

                        {/* Bottom row: Buttons (flush left) */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            onClick={() => handleReview(reviewId, 'approved', reviewNotes[reviewId], !isDeliverable)}
                            style={{
                              fontFamily: "'VT323', monospace",
                              fontSize: 16,
                              padding: '4px 12px',
                              border: '1px solid #86b89a',
                              borderRadius: 6,
                              background: '#86b89a',
                              color: '#12081e',
                              cursor: 'pointer',
                              letterSpacing: 0.5
                            }}
                          >
                            {approveLabel}
                          </button>
                          
                          <button
                            onClick={() => handleReview(reviewId, 'rejected', reviewNotes[reviewId] || 'Needs more work', !isDeliverable)}
                            style={{
                              fontFamily: "'VT323', monospace",
                              fontSize: 16,
                              padding: '4px 12px',
                              border: '1px solid #c9a85f',
                              borderRadius: 6,
                              background: 'transparent',
                              color: '#c9a85f',
                              cursor: 'pointer',
                              letterSpacing: 0.5
                            }}
                          >
                            ↩ RETURN
                          </button>
                          
                          <input 
                            type="text" 
                            placeholder="Add a note for the student..." 
                            value={reviewNotes[reviewId] || ''}
                            onChange={(e) => setReviewNotes(prev => ({ ...prev, [reviewId]: e.target.value }))}
                            style={{ 
                              flex: 1, 
                              minWidth: 200, 
                              background: 'transparent', 
                              border: '1px solid #2f3d36', 
                              borderRadius: 5, 
                              padding: '4px 12px', 
                              color: '#dbe4de', 
                              fontSize: 16, 
                              fontFamily: "'VT323', monospace",
                              outline: 'none'
                            }} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                )}

                {/* BY STEWARD VIEW */}
                {approvalView === 'steward' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(() => {
                    // Group submissions by student
                    const grouped: Record<string, any[]> = {}
                    pendingSubmissions.filter(sub => {
                      if (approvalFilter === 'deliverables') return !!sub.workshop_day_id
                      if (approvalFilter === 'engagement') return !sub.workshop_day_id
                      return true
                    }).forEach(sub => {
                      const name = sub.participant_name || 'Unknown Student'
                      if (!grouped[name]) grouped[name] = []
                      grouped[name].push(sub)
                    })
                    
                    const stewards = Object.entries(grouped)
                    if (stewards.length === 0) {
                      return (
                        <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 16, color: 'var(--mu,#9990ab)' }}>
                          All caught up — nothing matches this filter.
                        </div>
                      )
                    }
                    
                    return stewards.map(([name, items]) => {
                      const pendD = items.filter(s => !!s.workshop_day_id)
                      const pendE = items.filter(s => !s.workshop_day_id)
                      // Get actual student progress from fetched data
                      const profileId = items[0]?.profile_id
                      const studentProgress = participantsProgress.find(p => p.profileId === profileId)
                      const delivPct = studentProgress?.delivPct ?? 0
                      const engPct = studentProgress?.engPct ?? 0
                      const totalPct = studentProgress?.totalPct ?? 0
                      const approvedDelivs = studentProgress?.approvedDelivs ?? 0
                      const stageLabel = totalPct >= 100 ? 'Full bloom ✿' : totalPct >= 75 ? 'Lush mane' : totalPct >= 50 ? 'Filling in' : totalPct >= 25 ? 'Sprouting' : 'Seedling'
                      
                      return (
                        <div key={name} style={{ border: '1px solid var(--ln,#3a3352)', borderRadius: 10, background: '#181324', padding: '16px 18px' }}>
                          {/* Steward header row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <img src={chiaUri(totalPct)} alt="" width={40} height={50} style={{ imageRendering: 'pixelated', flex: 'none', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.35))' }} />
                            <div style={{ flex: 1, minWidth: 150 }}>
                              <div className="font-pixel" style={{ fontSize: 12, color: 'var(--tx,#e4e0ee)', marginBottom: 7 }}>{name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                                {[1, 2, 3].map(d => {
                                  const isApproved = d <= approvedDelivs
                                  const hasPending = pendD.some(s => s.day_number === d)
                                  return (
                                    <span key={d} className="font-pixel" style={{ fontSize: 9, padding: '3px 6px', borderRadius: 3, color: isApproved ? '#12081e' : hasPending ? '#12081e' : 'var(--mu,#9990ab)', background: isApproved ? 'var(--ok,#86b89a)' : hasPending ? 'var(--gold,#c9a85f)' : 'transparent', border: (isApproved || hasPending) ? 'none' : '1px solid var(--ln,#3a3352)' }}>D{d}</span>
                                  )
                                })}
                                <span style={{ fontSize: 14, color: 'var(--mu,#9990ab)' }}>{stageLabel} · {totalPct}%</span>
                              </div>
                            </div>
                            <span style={{ fontFamily: "'VT323'", fontSize: 17, color: '#c9a85f', border: '1px solid #c9a85f', borderRadius: 20, padding: '4px 12px' }}>
                              {items.length} pending
                            </span>
                          </div>

                          {/* Progress bar - shows ACTUAL student progress */}
                          <div style={{ height: 14, background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln,#3a3352)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{ float: 'left', height: '100%', width: `${delivPct}%`, background: 'var(--gold,#c9a85f)' }} />
                            <div style={{ float: 'left', height: '100%', width: `${engPct}%`, background: 'var(--ok,#86b89a)' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14, marginBottom: 14 }}>
                            <span style={{ color: 'var(--gold,#c9a85f)' }}>■ Deliverables {delivPct}%</span>
                            <span style={{ color: 'var(--ok,#86b89a)' }}>■ Engagement {engPct}%</span>
                          </div>

                          {/* Two column grid: Deliverables + Engagement */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                            {/* Deliverables column */}
                            <div style={{ border: '2px solid var(--gold,#c9a85f)', borderRadius: 8, padding: 12, background: 'rgba(201,168,95,.05)' }}>
                              <div className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#c9a85f)', marginBottom: 10 }}>⛃ DELIVERABLES · +25% EACH</div>
                              {pendD.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                  {pendD.map(d => {
                                    const reviewId = d.progress_id || d.id
                                    const dateStr = d.submitted_at ? new Date(d.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
                                    return (
                                      <div key={reviewId} style={{ border: '1px solid var(--ln,#3a3352)', borderRadius: 6, padding: 10, background: 'rgba(0,0,0,.25)' }}>
                                        <div style={{ fontSize: 17, color: 'var(--tx,#e4e0ee)', lineHeight: 1.25, marginBottom: 3 }}>{d.title || d.day_title || `Day ${d.day_number}`}</div>
                                        <div style={{ fontSize: 14, color: 'var(--mu,#9990ab)', marginBottom: 9 }}>Day {d.day_number} deliverable · {dateStr}</div>
                                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                          <button onClick={() => handleReview(reviewId, 'approved', reviewNotes[reviewId], false)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: '#141019', background: 'var(--ok,#86b89a)', border: 'none', borderRadius: 5, padding: '6px 12px', cursor: 'pointer' }}>✓ APPROVE +25%</button>
                                          <button onClick={() => handleReview(reviewId, 'rejected', reviewNotes[reviewId], false)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: 'var(--mu,#9990ab)', background: 'none', border: '2px solid var(--ln,#3a3352)', borderRadius: 5, padding: '5px 11px', cursor: 'pointer' }}>↩ RETURN</button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>No deliverables awaiting review.</div>
                              )}
                            </div>

                            {/* Engagement column */}
                            <div style={{ border: '2px solid var(--ok,#86b89a)', borderRadius: 8, padding: 12, background: 'rgba(134,184,154,.05)' }}>
                              <div className="font-pixel" style={{ fontSize: 9, color: 'var(--ok,#86b89a)', marginBottom: 10 }}>✦ ENGAGEMENT · +1–3%</div>
                              {pendE.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                  {pendE.map(e => {
                                    const reviewId = e.id
                                    const dateStr = e.submitted_at ? new Date(e.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
                                    return (
                                      <div key={reviewId} style={{ border: '1px solid var(--ln,#3a3352)', borderRadius: 6, padding: 10, background: 'rgba(0,0,0,.25)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                          <span className="font-pixel" style={{ fontSize: 8, color: '#86b89a', border: '1px solid #86b89a', borderRadius: 3, padding: '2px 6px' }}>{(e.kind || 'note').toUpperCase()}</span>
                                          <span style={{ fontSize: 17, color: 'var(--tx,#e4e0ee)', lineHeight: 1.2, flex: 1, minWidth: 0 }}>{e.title || 'Engagement'}</span>
                                        </div>
                                        <div style={{ fontSize: 14, color: 'var(--mu,#9990ab)', marginBottom: 9 }}>{e.source || 'Engagement'} · {dateStr}</div>
                                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                          <button onClick={() => handleReview(reviewId, 'approved', reviewNotes[reviewId], true)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: '#141019', background: 'var(--ok,#86b89a)', border: 'none', borderRadius: 5, padding: '6px 12px', cursor: 'pointer' }}>✓ APPROVE</button>
                                          <button onClick={() => handleReview(reviewId, 'rejected', reviewNotes[reviewId], true)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: 'var(--mu,#9990ab)', background: 'none', border: '2px solid var(--ln,#3a3352)', borderRadius: 5, padding: '5px 11px', cursor: 'pointer' }}>↩ RETURN</button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>No engagement awaiting review.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
                )}
                </>
              )}
            </div>
          )}

          {/* ═══════════════ AI LABS ═══════════════ */}
          {section === 'ailabs' && (
            <div style={{
              border: '2px solid var(--ln,#3a3352)',
              borderRadius: 12,
              background: '#201a30',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
              textAlign: 'center',
            }}>
              <div className="font-pixel" style={{ fontSize: 13, color: 'var(--s,#45d6ff)', letterSpacing: 1 }}>
                ⚡ AI LABS
              </div>
              <div style={{ fontSize: 17, color: 'var(--mu,#9990ab)', lineHeight: 1.5, maxWidth: 500 }}>
                Manage AI Lab platforms, workbench tools, and student creation settings.
              </div>
              <a
                href="/hub/ai-lab"
                className="font-pixel"
                style={{
                  fontSize: 11,
                  color: 'var(--bg,#12081e)',
                  background: 'var(--s,#45d6ff)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '14px 24px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                ⚡ OPEN AI LABS
              </a>
            </div>
          )}

        </div>
      </div>

      {/* ═══ Session Editor Modal ═══ */}
      {editorOpen && selEntry && (
        <div
          onClick={() => setEditorOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 64,
            background: 'rgba(6,4,12,.86)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(8px,2vw,28px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1140,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              border: '3px solid var(--ok,#74f0a0)',
              borderRadius: 16,
              background: 'var(--pn,#241542)',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(0,0,0,.7)',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px',
              borderBottom: '2px solid var(--ln,#3d2668)',
              background: 'linear-gradient(180deg,rgba(255,255,255,.05),transparent)',
            }}>
              <select
                className="font-pixel"
                value={selEntry.entry_type || 'text'}
                onChange={e => handleEntryFieldBlur(selEntry.id, 'entry_type', e.target.value)}
                style={{ 
                  fontSize: 11, 
                  color: '#141019', 
                  background: 'var(--gold,#ffd23f)', 
                  borderRadius: 20, 
                  padding: '6px 12px', 
                  flex: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="text" style={{ fontSize: 14 }}>TEXT</option>
                <option value="list" style={{ fontSize: 14 }}>LIST</option>
                <option value="dual" style={{ fontSize: 14 }}>DUAL</option>
                <option value="featured" style={{ fontSize: 14 }}>FEATURED</option>
                <option value="deliverable" style={{ fontSize: 14 }}>DELIVERABLE</option>
              </select>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>
                  SESSION {selEntry.num}
                </div>
                <div className="font-pixel" style={{ fontSize: 'clamp(11px,1.7vw,14px)', color: 'var(--tx,#efe6ff)', marginTop: 6, lineHeight: 1.4 }}>
                  {selEntry.title}
                </div>
              </div>
              <span className="font-pixel" style={{ fontSize: 7, color: isSaving ? 'var(--gold,#c9a85f)' : 'var(--ok,#74f0a0)', border: `1px solid ${isSaving ? 'var(--gold,#c9a85f)' : 'var(--ok,#74f0a0)'}`, borderRadius: 20, padding: '4px 9px', flex: 'none' }}>
                {isSaving ? '○ SAVING…' : '● SAVES LIVE'}
              </span>
              <button
                onClick={() => setEditorOpen(false)}
                className="font-pixel"
                style={{ fontSize: 9, color: 'var(--tx,#efe6ff)', background: 'none', border: '2px solid var(--ln,#3d2668)', borderRadius: 5, padding: '9px 12px', cursor: 'pointer', flex: 'none' }}
              >✓ SAVE & CLOSE</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'stretch' }}>
              {/* LEFT: text content */}
              <div style={{ flex: '3 1 460px', minWidth: 300, padding: 'clamp(18px,2.4vw,28px)' }}>
                <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>TOPIC TITLE</div>
                <input defaultValue={selEntry.title} onBlur={e => handleEntryFieldBlur(selEntry.id, 'title', e.target.value)} style={{ ...inputStyle, fontSize: 20, marginBottom: 12 }} />
                <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>SUBTITLE / SIDEBAR LABEL</div>
                <input defaultValue={selEntry.subtitle || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'subtitle', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 16 }} />
                
                {selEntry.entry_type === 'deliverable' ? (
                  (() => {
                    const bodyParts = (selEntry.body || '').split('<!--BLOCK-->')
                    const appliedBody = bodyParts[0] || ''
                    const labBody = bodyParts[1] || ''
                    const goalBody = bodyParts[2] || ''

                    const updateDeliverableBody = (idx: number, val: string) => {
                      const newParts = [...bodyParts]
                      while (newParts.length < 3) newParts.push('')
                      newParts[idx] = val
                      handleEntryFieldBlur(selEntry.id, 'body', newParts.join('<!--BLOCK-->'))
                    }

                    return (
                      <>
                        <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>PRINCIPLE APPLIED</div>
                        <div style={{ marginBottom: 16 }}>
                          <RichEditor
                            value={appliedBody}
                            onBlur={val => updateDeliverableBody(0, val)}
                            minHeight={150}
                            accent="var(--ok,#74f0a0)"
                          />
                        </div>

                        <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>LAB PROCESS</div>
                        <div style={{ marginBottom: 16 }}>
                          <RichEditor
                            value={labBody}
                            onBlur={val => updateDeliverableBody(1, val)}
                            minHeight={150}
                            accent="var(--ok,#74f0a0)"
                          />
                        </div>

                        <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>DELIVERABLE GOAL</div>
                        <div style={{ marginBottom: 16 }}>
                          <RichEditor
                            value={goalBody}
                            onBlur={val => updateDeliverableBody(2, val)}
                            minHeight={150}
                            accent="var(--ok,#74f0a0)"
                          />
                        </div>

                        <div className="font-vt323" style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>SUBMISSION PROMPT LABEL</div>
                        <input defaultValue={selEntry.submit_label || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'submit_label', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 16 }} placeholder="e.g. Paste your story asset link..." />
                      </>
                    )
                  })()
                ) : (
                  <>
                    <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>
                      CONTENT · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text — bold, italic, lists & links</span>
                    </div>
                    {(() => {
                      const bodyParts = (selEntry.body || '').split('<!--BLOCK-->')
                      const mainBody = bodyParts[0] || ''
                      const additionalBlocks = bodyParts.slice(1)
                      
                      return (
                        <>
                          <RichEditor
                            value={mainBody}
                            onBlur={val => handleEntryFieldBlur(selEntry.id, 'body', [val, ...additionalBlocks].join('<!--BLOCK-->'))}
                            minHeight={200}
                            accent="var(--ok,#74f0a0)"
                          />
                          
                          <div style={{ borderTop: '1px dashed var(--ln,#3d2668)', marginTop: 18, paddingTop: 16 }}>
                            <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 10, lineHeight: 1.4 }}>
                              ADDITIONAL TEXT BLOCKS · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text — each block appears below the content in the student's session</span>
                            </div>
                            {additionalBlocks.map((blk, idx) => (
                              <div key={idx} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span className="font-pixel" style={{ fontSize: 7, color: 'var(--gold,#ffd23f)' }}>◈ BLOCK {idx + 1}</span>
                                  <button 
                                    onClick={() => {
                                      const newBlocks = [...additionalBlocks]
                                      newBlocks.splice(idx, 1)
                                      handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                                    }} 
                                    className="font-pixel"
                                    style={{
                                      fontSize: 7, cursor: 'pointer', color: 'var(--warn,#ff7a7a)', background: 'transparent',
                                      border: '2px solid var(--ln,#3d2668)', borderRadius: 4, padding: '6px 9px'
                                    }}
                                  >✕ REMOVE</button>
                                </div>
                                <RichEditor
                                  value={blk}
                                  onBlur={val => {
                                    const newBlocks = [...additionalBlocks]
                                    newBlocks[idx] = val
                                    handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                                  }}
                                  minHeight={150}
                                  accent="var(--ok,#74f0a0)"
                                />
                              </div>
                            ))}
                            <button 
                              onClick={() => {
                                const newBlocks = [...additionalBlocks, '']
                                handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))
                              }}
                              className="font-pixel"
                              style={{
                                fontSize: 8, cursor: 'pointer', color: 'var(--ok,#74f0a0)', background: 'transparent',
                                border: '2px dashed var(--ok,#74f0a0)', borderRadius: 6, padding: '11px 13px', marginTop: 2
                              }}
                            >＋ ADD TEXT BLOCK</button>
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>

              {/* RIGHT: media rail */}
              <div style={{
                flex: '2 1 320px',
                minWidth: 260,
                borderLeft: '2px solid var(--ln,#3d2668)',
                background: 'rgba(0,0,0,.18)',
                padding: 'clamp(16px,2vw,24px)',
              }}>
                <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', letterSpacing: 1, marginBottom: 10 }}>
                  ◈ PHOTOS · VIDEO · LINKS
                </div>
                <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginBottom: 12, lineHeight: 1.4 }}>
                  Attach a visual to sit beside the text — matched to this session in the student's pop-up view.
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleMediaFileChange}
                    accept={uploadingMediaKind === 'photo' ? 'image/*' : uploadingMediaKind === 'video' ? 'video/*' : uploadingMediaKind === 'audio' ? 'audio/*' : '*/*'}
                  />
                  {isUploadingMedia ? (
                    <div className="font-pixel" style={{ fontSize: 10, color: 'var(--gold,#ffd23f)', padding: '10px 14px', animation: 'pulse 1.5s infinite' }}>
                      ⏳ UPLOADING {uploadingMediaKind?.toUpperCase()}...
                    </div>
                  ) : (
                    (['photo', 'video', 'audio', 'link'] as const).map(t => (
                      <button key={t} onClick={() => handleAddMedia(selEntry.id, t)} className="font-pixel" style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        padding: '10px 14px',
                        border: '2px dashed var(--ln,#3d2668)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,.25)',
                        color: 'var(--mu,#a493c9)',
                        cursor: 'pointer',
                      }}>＋ {t.toUpperCase()}</button>
                    ))
                  )}
                </div>
                {isLoadingMedia ? (
                  <div style={{ fontSize: 15, color: 'var(--gold,#ffd23f)', border: '2px dashed var(--ln,#3d2668)', borderRadius: 8, padding: 16, textAlign: 'center', lineHeight: 1.4, animation: 'pulse 1.5s infinite' }}>
                    Loading media...
                  </div>
                ) : entryMediaList.length === 0 ? (
                  <div style={{ fontSize: 15, color: 'var(--mu,#a493c9)', border: '2px dashed var(--ln,#3d2668)', borderRadius: 8, padding: 16, textAlign: 'center', lineHeight: 1.4 }}>
                    No visuals yet — add a photo, video, audio or link above. They appear beside this session's text in the student's pop-up.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {entryMediaList.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(0,0,0,.3)', border: '1px solid var(--ln,#3d2668)', borderRadius: 8, padding: '10px 14px' }}>
                        <span className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', flex: 'none', background: 'rgba(255,210,63,.1)', padding: '5px 7px', borderRadius: 4, marginTop: 4 }}>
                          {m.kind.toUpperCase()}
                        </span>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {m.label && <div style={{ fontSize: 14, color: 'var(--tx,#efe6ff)', marginBottom: 6 }}>{m.label}</div>}
                          
                          {m.kind === 'photo' && m.url ? (
                            <img src={m.url} alt={m.label || 'Attached photo'} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} />
                          ) : m.kind === 'video' && m.url ? (
                            <video src={m.url} controls style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }} />
                          ) : m.kind === 'audio' && m.url ? (
                            <audio src={m.url} controls style={{ width: '100%', marginTop: 4 }} />
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--mu,#a493c9)', wordBreak: 'break-all' }}>{m.url}</div>
                          )}
                        </div>
                        
                        <button onClick={() => handleRemoveMedia(m.id, selEntry.id)} style={{ fontSize: 14, color: 'var(--warn,#ff7a7a)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flex: 'none', marginTop: 2 }} title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 14, fontSize: 13, color: 'var(--mu,#a493c9)', lineHeight: 1.4 }}>
                  Edits save live to the student's Day view & walk-in scene.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CERTIFICATE PREVIEW OVERLAY ═══════════════ */}
      {showCertPreview && (
        <div 
          onClick={() => setShowCertPreview(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,4,16,.88)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(12px,3vw,40px)', overflow: 'auto' }}
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
              <div className="font-pixel" style={{ fontSize: 8, letterSpacing: 3, color: '#a07d2c' }}>✦ {certOrg.toUpperCase() || 'STEWARDWORKS'} ✦</div>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', letterSpacing: 5, color: '#8a6a2a', marginTop: 9, textTransform: 'uppercase' }}>Pilot Workshops · The Steward's Journey</div>
              <div style={{ height: 2, width: 130, background: '#c9a24a', margin: '18px auto' }}></div>
              <div style={{ fontSize: 'clamp(25px,4.8vw,42px)', fontWeight: 700, letterSpacing: 2, color: '#241a08' }}>Certificate of Completion</div>
              <div style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#5a4626', marginTop: 22, fontStyle: 'italic' }}>This certifies that</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 15, margin: '12px 0 6px', flexWrap: 'wrap' }}>
                <PixelSprite characterKey="nayeli" accent="#c9a24a" size={48} />
                <div style={{ fontSize: 'clamp(23px,4.2vw,36px)', fontWeight: 700, color: '#1a1206', borderBottom: '2px solid #c9a24a', padding: '0 18px 6px' }}>Student Name</div>
              </div>
              <div style={{ fontSize: 13, color: '#8a6a2a', letterSpacing: 2, marginBottom: 22, textTransform: 'uppercase' }}>Steward · Certified Steward</div>
              
              {certMessage ? (
                <div style={{ fontSize: 'clamp(15px,1.9vw,17px)', lineHeight: 1.75, color: '#3a2c14', maxWidth: 580, margin: '0 auto', whiteSpace: 'pre-wrap' }}>
                  {certMessage}
                </div>
              ) : (
                <div style={{ fontSize: 'clamp(15px,1.9vw,17px)', lineHeight: 1.75, color: '#3a2c14', maxWidth: 580, margin: '0 auto' }}>
                  has journeyed the full three-day intensive of <strong>The Steward's Journey</strong>, practicing <em>Active Production over Passive Consumption</em> and banking three original deliverables into the <strong>{certOrg}</strong> portfolio. In recognition of principled, human-in-the-loop craft with artificial intelligence — and of <strong>12 Steward Principles</strong> carried forward — this steward is hereby conferred the standing of <strong>Certified Steward</strong>.
                </div>
              )}

              <div style={{ borderTop: '2px solid #dcc890', borderBottom: '2px solid #dcc890', margin: '26px auto', padding: '18px 0', maxWidth: 580, textAlign: 'left' }}>
                <div className="font-pixel" style={{ fontSize: 8, color: '#a07d2c', letterSpacing: 2, textAlign: 'center', marginBottom: 15 }}>◆ DELIVERABLES OF RECORD ◆</div>
                {days.slice(0, 3).map((day, idx) => (
                  <div key={day.id} style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 11 }}>
                    <div style={{ flex: 'none', fontWeight: 700, color: '#8a6a2a', minWidth: 52 }}>D{idx + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, color: '#241a08', fontWeight: 700 }}>{(day as any).deliverable_title?.toUpperCase() || `DAY ${day.day_number} DELIVERABLE`}</div>
                      <div style={{ fontSize: 13, color: '#6a542c', wordBreak: 'break-all', fontFamily: "'Courier New',monospace" }}>https://example.com/...</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 580, margin: '30px auto 0' }}>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certFacilitator}</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>{certFacTitle} · {certOrg}</div>
                </div>
                <div style={{ flex: 'none', textAlign: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle at 38% 30%,#f6dd8c 0%,#e6bd54 46%,#c69528 78%,#9c7015 100%)', border: '3px solid #8a6a2a', boxShadow: '0 3px 10px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.4),inset 0 -6px 14px rgba(120,84,18,.5)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <img src="/images/cert/steward-seal.png" alt="Seal" style={{ width: '85%', height: '85%', objectFit: 'contain', opacity: 0.9 }} />
                  </div>
                  <div className="font-pixel" style={{ fontSize: 6, color: '#8a6a2a', marginTop: 7, letterSpacing: 2 }}>OFFICIAL SEAL</div>
                </div>
                <div style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>Student Name</div>
                  <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626' }}>THE STEWARD</div>
                </div>
              </div>

              <div style={{ maxWidth: 300, margin: '24px auto 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Segoe Script','Snell Roundhand','Brush Script MT',cursive", fontSize: 27, color: '#1a1206', lineHeight: 1 }}>{certSponsor}</div>
                <div style={{ borderTop: '2px solid #3a2c14', marginTop: 5, paddingTop: 6, fontSize: 11, letterSpacing: 1, color: '#5a4626', textTransform: 'uppercase' }}>FISCAL SPONSOR · {certSponsorOrg}</div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', maxWidth: 580, margin: '26px auto 0', fontSize: 11, color: '#8a6a2a', letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>
                <div>ISSUED {new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
                <div>CERTIFICATE NO. SW-TEST-0000</div>
              </div>

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

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Toast Notification */}
      <RetroToast
        message={toast}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
