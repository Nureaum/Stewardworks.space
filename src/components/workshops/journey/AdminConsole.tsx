'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import '@/app/hub/pilot-workshops/retro-theme.css'
import DeliverableMediaPreview, { isImageUrl } from '@/components/workshops/DeliverableMediaPreview'
import { uploadCreationImage, getAllGenerations } from '@/app/actions/workshops/engagement'
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
  getParticipantsProgress,
  getCohortCharacters,
  getAllEngagementsHistory
} from '@/app/actions/workshops/admin-reviews'
import { PixelSprite } from '@/components/workshops/journey'
import { updateWorkshopDay, createWorkshopDay } from '@/app/actions/workshops/workshop-days'
import { updateCohort, uploadCohortThumbnail, getCohorts } from '@/app/actions/workshops/cohorts'
import { createSection, updateSection, deleteSection } from '@/app/actions/workshops/sections'
import { createEntry, updateEntry, deleteEntry, reorderEntries } from '@/app/actions/workshops/entries'
import { SortableList } from '@/components/admin/SortableList'
import { GripVertical } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RichEditor from './RichEditor'
import { createEntryMedia, deleteEntryMedia, getEntryMedia, uploadEntryMedia, updateEntryMedia, reorderEntryMedia } from '@/app/actions/workshops/entry-media'
import { createPrinciple, updatePrinciple, deletePrinciple } from '@/app/actions/workshops/principles'
import { addShowcaseItem, updateShowcaseItem, deleteShowcaseItem, getShowcaseItems, seedShowcaseItems, getStudentShowcaseDeliverables } from '@/app/actions/workshops/showcase'
import { getShowcaseSettings, updateShowcaseSettings } from '@/app/actions/workshops/showcase_settings'
import { getPlatforms, createPlatform, deletePlatform } from '@/app/actions/workshops/admin'
import ConfirmDialog from './ConfirmDialog'
import RetroToast from './RetroToast'

// ─── Types ─────────────────────────────────────────────────
type AdminSection = 'cohort' | 'curriculum' | 'principles' | 'contributors' | 'approvals' | 'certificate' | 'ailabs' | 'progress'
type SidebarGroup = 'cohort-editing' | 'approvals' | 'contributors' | 'ailabs' | 'progress'

interface AdminConsoleProps {
  cohortId: string
  cohortName: string
  cohort: any
  days: DayWithSections[]
  principles: WorkshopPrinciple[]
  onReturnToGame: () => void
  cameFromAdminPanel?: boolean
  initialSection?: string
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
  fontSize: 24,
  padding: '14px 16px',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  lineHeight: 1.5,
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
const localInputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,.35)',
  border: '2px solid var(--ln,#3a3352)',
  borderRadius: 6,
  color: 'var(--tx,#e4e0ee)',
  fontFamily: '"VT323", monospace',
  fontSize: 22,
  padding: '12px 14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

function SortableBlockItem({ id, idx, blockRawContent, blockType, blockTitle, listItems, updateBlock, onRemove }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1, opacity: isDragging ? 0.9 : 1 };

  const btnStyle = (isActive: boolean) => ({
    fontSize: 9, cursor: 'pointer', 
    color: isActive ? 'var(--bg,#1a1025)' : 'var(--mu,#a493c9)', 
    background: isActive ? 'var(--mu,#a493c9)' : 'transparent', 
    border: '2px solid var(--ln,#3d2668)', 
    borderRadius: 4, padding: '6px 12px'
  });

  return (
    <div ref={setNodeRef} style={{ ...style, marginBottom: 14, position: 'relative', border: '1px solid var(--ln,#3d2668)', borderRadius: 8, padding: 12, background: isDragging ? 'var(--bg,#14101f)' : 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? 6 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--mu,#a493c9)', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={16} />
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--gold,#ffd23f)', fontSize: 12, marginTop: 1 }}>{isExpanded ? '▼' : '▶'}</span>
            <span className="font-pixel" style={{ fontSize: 9, color: 'var(--gold,#ffd23f)' }}>◈ BLOCK {idx + 1}</span>
            {!isExpanded && blockTitle && (
              <span style={{ color: 'var(--tx,#efe6ff)', fontSize: 14, marginLeft: 8, opacity: 0.8, fontFamily: 'inherit' }}>{blockTitle}</span>
            )}
          </button>
          {isExpanded && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  if (blockType === 'list') {
                    updateBlock('text', blockTitle, listItems.join('\n'))
                  } else {
                    const items = blockRawContent 
                      ? blockRawContent.split(/<\/?p>|<br\s*\/?>|<\/?div>/i)
                          .map((s: string) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
                          .filter(Boolean)
                      : []
                    updateBlock('list', blockTitle, items)
                  }
                }}
                className="font-pixel"
                style={btnStyle(blockType === 'list')}
              >LIST</button>
              <button
                onClick={() => updateBlock(blockType === 'highlighted_box' ? 'text' : 'highlighted_box', blockTitle, blockType === 'list' ? listItems.join('\n') : blockRawContent)}
                className="font-pixel"
                style={btnStyle(blockType === 'highlighted_box')}
              >HIGHLIGHTED BOX</button>
              <button
                onClick={() => updateBlock(blockType === 'quote' ? 'text' : 'quote', blockTitle, blockType === 'list' ? listItems.join('\n') : blockRawContent)}
                className="font-pixel"
                style={btnStyle(blockType === 'quote')}
              >QUOTE</button>
            </div>
          )}
        </div>
        <button 
          onClick={onRemove} 
          className="font-pixel"
          style={{
            fontSize: 7, cursor: 'pointer', color: 'var(--warn,#ff7a7a)', background: 'transparent',
            border: '2px solid var(--ln,#3d2668)', borderRadius: 4, padding: '6px 9px'
          }}
        >✕ REMOVE</button>
      </div>
      
      {isExpanded && (
        <>
          <input 
            defaultValue={blockTitle}
            onBlur={e => updateBlock(blockType, e.target.value, blockType === 'list' ? listItems : blockRawContent)}
            placeholder="Block Title..."
            style={{ ...localInputStyle, fontSize: 16, marginBottom: 8, padding: '10px 12px' }}
          />
          {blockType === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {listItems.map((item: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div className="font-pixel" style={{ color: 'var(--pk,#ff5fd2)', fontSize: 10, paddingTop: 14 }}>◈</div>
                  <textarea
                    defaultValue={item}
                    onBlur={e => {
                      const newItems = [...listItems]
                      newItems[i] = e.target.value
                      updateBlock('list', blockTitle, newItems)
                    }}
                    style={{
                      ...localInputStyle,
                      fontSize: 16,
                      padding: '12px 14px',
                      minHeight: 60,
                      resize: 'vertical',
                      flex: 1,
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    onClick={() => {
                      const newItems = [...listItems]
                      newItems.splice(i, 1)
                      updateBlock('list', blockTitle, newItems)
                    }}
                    className="font-pixel"
                    style={{
                      fontSize: 12, cursor: 'pointer', color: 'var(--warn,#ff7a7a)', background: 'transparent',
                      border: 'none', padding: '12px 4px', flex: 'none'
                    }}
                    title="Remove item"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [...listItems, '']
                  updateBlock('list', blockTitle, newItems)
                }}
                className="font-pixel"
                style={{
                  fontSize: 9, cursor: 'pointer', color: 'var(--pk,#ff5fd2)', background: 'transparent',
                  border: '2px dashed var(--pk,#ff5fd2)', borderRadius: 6, padding: '12px', marginTop: 4
                }}
              >＋ ADD LIST ITEM</button>
            </div>
          ) : (
            <RichEditor
              value={blockRawContent}
              onBlur={val => updateBlock(blockType, blockTitle, val)}
              minHeight={150}
              accent="var(--ok,#74f0a0)"
            />
          )}
        </>
      )}
    </div>
  );
}

export function AdditionalBlocksEditor({ blocks, onSave, endRef }: { blocks: string[], onSave: (newBlocks: string[]) => void, endRef: React.RefObject<HTMLDivElement> }) {
  const [internalBlocks, setInternalBlocks] = useState(() => blocks.map(b => ({ id: Math.random().toString(36).substring(2), content: b })));

  useEffect(() => {
    setInternalBlocks(prev => {
      if (blocks.length === prev.length && blocks.every((b, i) => prev[i]?.content === b)) {
        return prev;
      }
      
      if (blocks.length === prev.length) {
        return prev.map((p, i) => ({ ...p, content: blocks[i] }));
      }

      return blocks.map((b, i) => {
        const existing = prev.find(p => p.content === b);
        if (existing) return existing;
        
        if (prev[i] && !blocks.includes(prev[i].content)) {
          return { ...prev[i], content: b };
        }
        
        return { id: Math.random().toString(36).substring(2), content: b };
      });
    });
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setInternalBlocks(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        onSave(newArray.map(item => item.content));
        return newArray;
      });
    }
  }

  return (
    <>
      <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6, marginTop: 24 }}>
        ADDITIONAL TEXT BLOCKS · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text — each block appears below the content</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={internalBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {internalBlocks.map((blkObj, idx) => {
            const blk = blkObj.content;
            let blockType = 'text'
            let blockTitle = ''
            let blockRawContent = blk

            const typeMatch = blockRawContent.match(/^<!--TYPE:(.*?)-->/)
            if (typeMatch) {
              blockType = typeMatch[1]
              blockRawContent = blockRawContent.substring(typeMatch[0].length)
            }

            const titleMatch = blockRawContent.match(/^<!--TITLE:(.*?)-->/)
            if (titleMatch) {
              blockTitle = titleMatch[1]
              blockRawContent = blockRawContent.substring(titleMatch[0].length)
            }

            let listItems: string[] = []
            if (blockType === 'list') {
              try {
                listItems = JSON.parse(blockRawContent)
                if (!Array.isArray(listItems)) listItems = []
              } catch (e) {
                listItems = blockRawContent ? blockRawContent.split('<!--LIST_ITEM-->') : []
              }
            }

            const updateBlock = (newType: string, newTitle: string, newContent: string | string[]) => {
              const newBlocks = [...internalBlocks]
              let blockStr = ''
              if (newType !== 'text') {
                blockStr += `<!--TYPE:${newType}-->`
              }
              blockStr += `<!--TITLE:${newTitle}-->`
              if (newType === 'list') {
                blockStr += JSON.stringify(newContent)
              } else {
                blockStr += newContent as string
              }
              newBlocks[idx] = { ...newBlocks[idx], content: blockStr };
              onSave(newBlocks.map(b => b.content))
            }

            const onRemove = () => {
              const newBlocks = [...internalBlocks]
              newBlocks.splice(idx, 1)
              onSave(newBlocks.map(b => b.content))
            }

            return (
              <SortableBlockItem
                key={blkObj.id}
                id={blkObj.id}
                idx={idx}
                blockRawContent={blockRawContent}
                blockType={blockType}
                blockTitle={blockTitle}
                listItems={listItems}
                updateBlock={updateBlock}
                onRemove={onRemove}
              />
            )
          })}
        </SortableContext>
      </DndContext>
      <button 
        onClick={() => {
          const newBlocks = [...internalBlocks.map(b => b.content), '']
          onSave(newBlocks)
          setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 100)
        }}
        className="font-pixel"
        style={{
          fontSize: 8, cursor: 'pointer', color: 'var(--ok,#74f0a0)', background: 'transparent',
          border: '2px dashed var(--ok,#74f0a0)', borderRadius: 6, padding: '11px 13px', marginTop: 2
        }}
      >＋ ADD TEXT BLOCK</button>
      <div ref={endRef} style={{ height: 1 }} />
    </>
  );
}

export default function AdminConsole({
  cohortId,
  cohortName,
  cohort,
  days,
  principles,
  onReturnToGame,
  cameFromAdminPanel,
  initialSection: initialSectionProp,
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
  const [section, setSection] = useState<AdminSection>((initialSectionProp as AdminSection) || 'cohort')
  const [cohortThumb, setCohortThumb] = useState(initialThumb)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [entryMediaList, setEntryMediaList] = useState<any[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blocksEndRef = useRef<HTMLDivElement>(null)
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
  const [ncFileToUpload, setNcFileToUpload] = useState<File | null>(null)
  const [isUploadingNcFile, setIsUploadingNcFile] = useState(false)
  const ncFileInputRef = useRef<HTMLInputElement>(null)
  const [ncPreviewFile, setNcPreviewFile] = useState<File | null>(null)
  const [ncPreviewObjectUrl, setNcPreviewObjectUrl] = useState<string | null>(null)
  const ncPreviewFileInputRef = useRef<HTMLInputElement>(null)
  const [ncBlurb, setNcBlurb] = useState('')
  const [ncMeta, setNcMeta] = useState('')
  const [ncPaid, setNcPaid] = useState(true)
  const [ncProjectType, setNcProjectType] = useState('')
  const [showcaseList, setShowcaseList] = useState<WorkshopShowcase[]>([])
  const [editingShowcaseId, setEditingShowcaseId] = useState<string | null>(null)
  const [showcaseSubTab, setShowcaseSubTab] = useState<'contributor' | 'student'>('contributor')
  const [studentShowcaseItems, setStudentShowcaseItems] = useState<any[]>([])
  const [isLoadingStudentShowcase, setIsLoadingStudentShowcase] = useState(false)
  const [showcaseSettings, setShowcaseSettings] = useState<any>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingStudentItem, setEditingStudentItem] = useState<any | null>(null)
  const [editStudentTitle, setEditStudentTitle] = useState('')
  const [editStudentDescription, setEditStudentDescription] = useState('')
  const [editStudentUrl, setEditStudentUrl] = useState('')
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  // Approvals state
  const [approvalView, setApprovalView] = useState<'log' | 'steward'>('log')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [participantsProgress, setParticipantsProgress] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [reviewingIds, setReviewingIds] = useState<Record<string, 'approving' | 'rejecting'>>({})
  // Platforms state
  const [platformsData, setPlatformsData] = useState<{ id: string; name: string; url: string; is_default: boolean }[]>([])
  const [newPlatformName, setNewPlatformName] = useState('')
  const [newPlatformUrl, setNewPlatformUrl] = useState('')
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false)

  // User Progress state
  const [userCharacters, setUserCharacters] = useState<Record<string, any>>({})
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [progressSearch, setProgressSearch] = useState('')
  const [progressPage, setProgressPage] = useState(1)
  const PROGRESS_PER_PAGE = 10
  const [allCohorts, setAllCohorts] = useState<any[]>([])
  const [selectedCohortId, setSelectedCohortId] = useState(cohortId)
  const [progressData, setProgressData] = useState<any[]>([])
  const [isLoadingCohortProgress, setIsLoadingCohortProgress] = useState(false)

  // Toast and confirm dialog state
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const [linkInputDialog, setLinkInputDialog] = useState<{
    entryId: string
    kind: 'link'
  } | null>(null)
  const [linkInputValue, setLinkInputValue] = useState('')

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
        const settings = await getShowcaseSettings()
        setShowcaseSettings(settings)
      } catch (e) {
        console.error('Failed to load showcase items', e)
        setShowcaseList([])
      }
    }
    loadShowcase()
  }, [cohortId])

  // Load platforms when AI Labs section is active
  React.useEffect(() => {
    if (section === 'ailabs') {
      const loadPlatforms = async () => {
        setIsLoadingPlatforms(true)
        try {
          const data = await getPlatforms(cohortId)
          setPlatformsData(data || [])
        } catch (e) {
          console.error('Failed to load platforms', e)
          setPlatformsData([])
        } finally {
          setIsLoadingPlatforms(false)
        }
      }
      loadPlatforms()
    }
  }, [cohortId, section])

  // Load characters when User Progress section is active
  React.useEffect(() => {
    if (section === 'progress') {
      // Load all cohorts for the dropdown
      const loadCohorts = async () => {
        try {
          const cohorts = await getCohorts()
          setAllCohorts(cohorts || [])
        } catch (e) {
          console.error('Failed to load cohorts', e)
        }
      }
      loadCohorts()
    }
  }, [section])

  // Load progress data when selected cohort changes
  React.useEffect(() => {
    if (section === 'progress' && selectedCohortId) {
      setIsLoadingProgress(true)
      setIsLoadingCohortProgress(true)
      const loadProgressData = async () => {
        try {
          const [progress, chars] = await Promise.all([
            getParticipantsProgress(selectedCohortId),
            getCohortCharacters(selectedCohortId)
          ])
          setProgressData(progress || [])
          const charMap: Record<string, any> = {}
          ;(chars || []).forEach((c: any) => { charMap[c.profile_id] = c })
          setUserCharacters(charMap)
        } catch (e) {
          console.error('Failed to load progress data', e)
          setProgressData([])
        } finally {
          setIsLoadingProgress(false)
          setIsLoadingCohortProgress(false)
        }
      }
      loadProgressData()
    }
  }, [selectedCohortId, section])

  const handleReview = async (progressId: string, status: 'approved' | 'rejected', note?: string, isEngagement?: boolean) => {
    setReviewingIds(prev => ({ ...prev, [progressId]: status === 'approved' ? 'approving' : 'rejecting' }))
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
    } finally {
      setReviewingIds(prev => {
        const next = { ...prev };
        delete next[progressId];
        return next;
      })
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
    setConfirmDialog({
      message: 'Delete this entry? This cannot be undone.',
      onConfirm: async () => {
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
        setConfirmDialog(null)
      }
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
    setConfirmDialog({
      message: 'Delete this entire section and all its entries? This cannot be undone.',
      onConfirm: async () => {
        await deleteSection(sectionId)
        setDaysData(prev => prev.map(d =>
          d.id === dayId
            ? { ...d, sections: (d.sections || []).filter((s: any) => s.id !== sectionId) }
            : d
        ))
        setConfirmDialog(null)
      }
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

  const handleEntryFieldBlur = (entryId: string, field: string, value: any) => {
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
      setLinkInputValue('')
      setLinkInputDialog({ entryId, kind })
    } else {
      setUploadingMediaKind(kind)
      // Small timeout to ensure state is set before click
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 50)
    }
  }

  const handleLinkInputSubmit = async () => {
    if (!linkInputDialog || !linkInputValue.trim()) return
    const { entryId } = linkInputDialog
    const url = linkInputValue.trim()
    setLinkInputDialog(null)
    setLinkInputValue('')
    setIsUploadingMedia(true)
    setUploadingMediaKind(null)
    saveField(async () => {
      try {
        await createEntryMedia(entryId, { kind: 'link', url, label: '' })
        const updatedMedia = await getEntryMedia(entryId)
        setEntryMediaList(updatedMedia)
      } finally {
        setIsUploadingMedia(false)
      }
    })
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
    setConfirmDialog({
      message: 'Delete this media attachment? This cannot be undone.',
      onConfirm: async () => {
        await deleteEntryMedia(mediaId)
        const updatedMedia = await getEntryMedia(entryId)
        setEntryMediaList(updatedMedia)
        setConfirmDialog(null)
      }
    })
  }

  const handleMediaCaptionChange = async (mediaId: string, newLabel: string) => {
    try {
      setEntryMediaList(prev => prev.map(m => m.id === mediaId ? { ...m, label: newLabel } : m));
      await updateEntryMedia(mediaId, { label: newLabel });
    } catch (e) {
      console.error(e);
      alert('Failed to update caption');
    }
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

  const handleUpdatePrinciple = async (principleId: string, field: string, value: string) => {
    await saveField(async () => {
      await updatePrinciple(principleId, { [field]: value } as any)
      // Update local state to reflect changes immediately
      setPrinciplesList(prev => prev.map(p => 
        p.id === principleId ? { ...p, [field]: value } : p
      ))
    })
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
      // Upload file if selected from device
      let finalLink = ncLink
      if (ncFileToUpload) {
        setIsUploadingNcFile(true)
        const formData = new FormData()
        formData.append('file', ncFileToUpload)
        finalLink = await uploadCreationImage(formData)
        setIsUploadingNcFile(false)
      }

      // Auto-detect type from URL/file
      let detectedType = ncType
      const url = (finalLink || '').toLowerCase()
      if (url) {
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?|#|$|\/)/i.test(url) ||
                        url.includes('/content-uploads/') || url.includes('/uploads/') ||
                        url.includes('placehold') || url.includes('placeholder') ||
                        url.match(/\/(jpg|jpeg|png|gif|webp)$/i) ||
                        (url.includes('supabase') && url.includes('/storage/') && !url.match(/\.(mp4|webm|mov|mp3|wav|ogg|pdf)/i))
        const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('loom.com') ||
                        /\.(mp4|webm|mov|avi|mkv)(\?|#|$|\/)/i.test(url)
        const isAudio = /\.(mp3|wav|ogg|m4a|flac|aac|wma)(\?|#|$|\/)/i.test(url) ||
                        url.includes('soundcloud.com') || url.includes('spotify.com')
        
        // Priority: video > audio > image (image stored as 'article' in DB, auto-detected on display)
        if (isVideo) detectedType = 'video'
        else if (isAudio) detectedType = 'audio'
        else if (isImage) detectedType = 'article'
      }
      // File type detection overrides URL detection (more reliable)
      if (ncFileToUpload) {
        if (ncFileToUpload.type.startsWith('image/')) detectedType = 'article'
        else if (ncFileToUpload.type.startsWith('video/')) detectedType = 'video'
        else if (ncFileToUpload.type.startsWith('audio/')) detectedType = 'audio'
      }

      let uploadedPreviewUrl: string | null = null
      if (ncPreviewFile) {
        const previewFormData = new FormData()
        previewFormData.append('file', ncPreviewFile)
        uploadedPreviewUrl = await uploadCreationImage(previewFormData)
      }

      const finalMeta = uploadedPreviewUrl 
        ? JSON.stringify({ meta: ncMeta || '', previewUrl: uploadedPreviewUrl }) 
        : (ncPreviewObjectUrl && !ncPreviewFile) // Keep existing previewUrl if not changed
          ? JSON.stringify({ meta: ncMeta || '', previewUrl: ncPreviewObjectUrl })
          : ncMeta || ''

      if (editingShowcaseId) {
        // Update existing item
        await updateShowcaseItem(editingShowcaseId, {
          title: ncTitle,
          author: ncAuthor || 'Community Contributor',
          type: detectedType,
          url: finalLink || undefined,
          blurb: ncBlurb || 'Contributor media.',
          meta: finalMeta,
          is_paid: ncPaid,
          theme: 'How to Use AI',
          project_type: ncProjectType || null,
        })
        setEditingShowcaseId(null)
      } else {
        // Add new item
        await addShowcaseItem(cohortId, {
          title: ncTitle,
          author: ncAuthor || 'Community Contributor',
          type: detectedType,
          url: finalLink || undefined,
          blurb: ncBlurb || 'Contributor media.',
          meta: finalMeta,
          is_paid: ncPaid,
          theme: 'How to Use AI',
          project_type: ncProjectType || null,
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
      setNcFileToUpload(null)
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
    
    let metaStr = item.meta || ''
    let parsedPreviewUrl: string | null = null
    try {
      const d = JSON.parse(item.meta || '{}')
      if (d && typeof d === 'object' && d.meta !== undefined) {
        metaStr = d.meta
        parsedPreviewUrl = d.previewUrl || null
      }
    } catch {}
    
    setNcMeta(metaStr)
    setNcPreviewFile(null)
    setNcPreviewObjectUrl(parsedPreviewUrl)
    setNcPaid(item.is_paid)
    setNcProjectType(item.project_type || '')
  }

  const handleCancelEdit = () => {
    setEditingShowcaseId(null)
    setNcTitle('')
    setNcAuthor('')
    setNcEmail('')
    setNcLink('')
    setNcFileToUpload(null)
    setNcBlurb('')
    setNcMeta('')
    setNcProjectType('')
  }

  const handleDeleteShowcase = async (id: string) => {
    setConfirmDialog({
      message: '⚠️ Warning: Deleting this contribution will also permanently remove it from the Library and all Student views. This cannot be undone.',
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
          fontSize: '11px',
          lineHeight: '1.6',
          cursor: 'pointer',
          padding: '11px 16px',
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
            fontSize: '9px',
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

  // ─── Return to Game button (sidebar) ───────────────────────────────
  const ReturnBtn = ({ wide }: { wide?: boolean }) => (
    <button
      onClick={() => {
        if (cameFromAdminPanel) {
          router.push('/admin/announcements')
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

  // ─── Top-right toggle button ───────────────────────────────
  const TopRightBtn = () => (
    <button
      onClick={() => {
        if (cameFromAdminPanel) {
          // Came from admin panel → go to student/game view
          onReturnToGame()
        } else {
          // Came from student toggle → go back to main admin console
          router.push('/admin/announcements')
        }
      }}
      style={{
        padding: '11px 14px',
        borderRadius: 6,
        border: '2px solid var(--s,#45d6ff)',
        background: 'transparent',
        color: 'var(--s,#45d6ff)',
        whiteSpace: 'nowrap',
        flex: 'none',
        boxShadow: '0 0 12px rgba(69,214,255,.25)',
        cursor: 'pointer',
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '8px',
        lineHeight: '1.6',
      }}
    >
      {cameFromAdminPanel ? '▸ GO TO GAME' : '◂ RETURN TO ADMIN'}
    </button>
  )

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,.35)',
    border: '2px solid var(--ln,#3a3352)',
    borderRadius: 6,
    color: 'var(--tx,#e4e0ee)',
    fontFamily: '"VT323", monospace',
    fontSize: 22,
    padding: '12px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }



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
    <div className="font-vt323" style={rootStyle}>

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
          <TopRightBtn />
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
            <NavBtn id="progress" icon="▣" label="User Progress" count={participantsProgress?.length || 0} />
            <NavBtn id="contributors" icon="❀" label="Showcase" count={showcaseList?.length || 0} />
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
                      padding: '9px 14px',
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
              <div className="font-pixel" style={{ fontSize: 14, color: 'var(--gold,#ffd23f)', marginBottom: 20 }}>
                ◈ COHORT SETTINGS
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="font-vt323" style={{ fontSize: 20, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Cohort Name</div>
                  <input
                    defaultValue={cohort?.name || ''}
                    onBlur={e => saveField(() => updateCohort(cohortId, { name: e.target.value }))}
                    style={{ ...inputStyle }}
                  />
                </div>
                
                <div>
                  <div className="font-vt323" style={{ fontSize: 20, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Description</div>
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
                  <div className="font-vt323" style={{ fontSize: 20, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Thumbnail Image</div>
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
                    <div className="font-vt323" style={{ fontSize: 20, color: 'var(--mu,#a493c9)', margin: '0 2px 4px' }}>Status</div>
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
                        fontSize: 9,
                        padding: '9px 14px',
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
                    fontSize: 9,
                    padding: '9px 14px',
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
                    <div className="font-pixel" style={{ fontSize: 10, color: 'var(--gold,#ffd23f)', margin: '2px 4px 8px', letterSpacing: 1 }}>
                      DAY {String(activeDay.day_number).padStart(2, '0')} · WORKSHOP DAY
                    </div>
                    <input
                      defaultValue={activeDay.title}
                      placeholder="Day title…"
                      onBlur={e => handleDayFieldBlur(activeDay.id, 'title', e.target.value)}
                      style={{ ...inputStyle, fontSize: 18, lineHeight: 1.5, padding: '10px 12px', marginBottom: 10 }}
                    />
                    <div className="font-vt323" style={{ fontSize: 19, color: 'var(--mu,#a493c9)', margin: '0 2px 5px' }}>Short blurb — map & day header</div>
                    <textarea
                      defaultValue={activeDay.content_body || activeDay.blurb || ''}
                      rows={2}
                      placeholder="Short intro shown on the map & day header…"
                      onBlur={e => handleDayFieldBlur(activeDay.id, 'content_body', e.target.value)}
                      style={{ ...textareaStyle, fontSize: 18, padding: '10px 12px', marginBottom: 12 }}
                    />
                    <div className="font-vt323" style={{ fontSize: 19, color: 'var(--mu,#a493c9)', margin: '0 2px 5px' }}>
                      ◈ Level intro — the card shown when a steward enters this day's scene
                    </div>
                    <textarea
                      defaultValue={activeDay.intro || ''}
                      rows={4}
                      placeholder="Set the scene: what act is this, what will they gather…"
                      onBlur={e => handleDayFieldBlur(activeDay.id, 'intro', e.target.value)}
                      style={{ ...textareaStyle, fontSize: 18, padding: '10px 12px', borderColor: 'var(--gold,#ffd23f)', marginBottom: 15 }}
                    />
                    <div className="font-vt323" style={{
                      fontSize: 17,
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
                          padding: '12px 14px',
                          marginBottom: 12,
                        }}>
                          <div className="font-pixel" style={{ fontSize: 11, color: 'var(--mu,#a493c9)', letterSpacing: 1, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>◇ SESSION HEADER</span>
                            <button onClick={() => handleDeleteSection(sec.id, activeDay.id)} style={{ fontSize: 14, color: '#cf9760', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }} title="Delete section">✕</button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <input
                              defaultValue={sec.hour}
                              placeholder="HOUR A"
                              onBlur={e => handleSectionFieldBlur(sec.id, 'hour', e.target.value)}
                              style={{ ...inputStyle, flex: 1, minWidth: 0, fontFamily: "'Press Start 2P', monospace", color: 'var(--gold,#ffd23f)', fontSize: 10, padding: '8px 10px', letterSpacing: '.5px' }}
                            />
                            <input
                              className="font-retro"
                              defaultValue={sec.duration}
                              placeholder="1 hr"
                              onBlur={e => handleSectionFieldBlur(sec.id, 'duration', e.target.value)}
                              style={{ ...inputStyle, width: 60, flex: 'none', fontSize: 14, padding: '8px 10px', textAlign: 'center' }}
                            />
                          </div>
                          <input
                            className="font-retro"
                            defaultValue={sec.title}
                            placeholder="Session title…"
                            onBlur={e => handleSectionFieldBlur(sec.id, 'title', e.target.value)}
                            style={{ ...inputStyle, fontSize: 17, padding: '10px 12px' }}
                          />
                        </div>

                        {/* Entries — drag to reorder */}
                        {(sec.entries || []).length > 0 && (
                          <SortableList
                            items={(sec.entries || []).map((en: any) => ({ ...en, id: en.id }))}
                            onChange={async (newOrder) => {
                              // Optimistic update
                              setDaysData(prev => prev.map(d => d.id !== activeDay.id ? d : {
                                ...d,
                                sections: d.sections.map((s: any) => s.id !== sec.id ? s : {
                                  ...s,
                                  entries: newOrder,
                                }),
                              }));
                              // Persist
                              await reorderEntries(sec.id, newOrder.map((en, idx) => ({ id: en.id, sort_order: idx })));
                            }}
                            renderItem={(en: any, isDragging: boolean, dragHandleProps: any) => {
                              const ei = (sec.entries || []).findIndex((e: any) => e.id === en.id);
                              return (
                                <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, marginBottom: 8, background: isDragging ? 'rgba(255,210,63,.06)' : 'transparent', borderRadius: 8 }}>
                                  <div
                                    {...dragHandleProps}
                                    style={{ display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 2, color: 'var(--mu,#a493c9)', cursor: 'grab', opacity: 0.5, touchAction: 'none' }}
                                    title="Drag to reorder"
                                  >
                                    <GripVertical size={14} />
                                  </div>
                                  <button
                                    onClick={() => { setSelectedEntry(en.id); setEditorOpen(true); }}
                                    onPointerDown={e => e.stopPropagation()}
                                    className="font-retro"
                                    style={{
                                      flex: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '9px 10px',
                                      border: `2px solid ${selectedEntry === en.id ? 'var(--gold,#c9a85f)' : isDragging ? 'var(--gold,#c9a85f)' : 'var(--ln,#3d2668)'}`,
                                      borderRadius: 8,
                                      background: selectedEntry === en.id ? 'rgba(201,168,95,.1)' : isDragging ? 'rgba(201,168,95,.07)' : 'rgba(0,0,0,.15)',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      fontFamily: '"VT323", monospace',
                                      boxShadow: isDragging ? '0 8px 20px -8px rgba(0,0,0,.6)' : 'none',
                                    }}
                                  >
                                    <span className="font-pixel" style={{
                                      fontSize: 9,
                                      color: 'var(--gold,#ffd23f)',
                                      background: 'rgba(0,0,0,.3)',
                                      borderRadius: 4,
                                      padding: '5px 7px',
                                      flex: 'none',
                                    }}>
                                      {String(ei + 1).padStart(2, '0')}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div className="font-pixel" style={{ fontSize: 11, color: 'var(--tx,#efe6ff)', lineHeight: 1.4 }}>{en.title}</div>
                                      <div className="font-vt323" style={{ fontSize: 18, color: 'var(--mu,#a493c9)', marginTop: 4, lineHeight: 1.3 }}>
                                        {en.subtitle || en.entry_type}
                                      </div>
                                    </div>
                                    <span style={{ color: 'var(--mu,#a493c9)', fontSize: 16 }}>›</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEntry(en.id, sec.id)}
                                    onPointerDown={e => e.stopPropagation()}
                                    style={{ fontSize: 16, color: '#cf9760', background: 'rgba(0,0,0,.2)', border: '1px solid #5a4636', borderRadius: 6, padding: '0 8px', cursor: 'pointer', flex: 'none' }}
                                    title="Delete entry"
                                  >✕</button>
                                </div>
                              );
                            }}
                          />
                        )}

                        <button
                          onClick={() => handleAddEntry(sec.id)}
                          className="font-pixel"
                          style={{
                            fontSize: 10,
                            color: 'var(--p,#ff5fd2)',
                            background: 'none',
                            border: '2px dashed var(--p,#ff5fd2)',
                            borderRadius: 6,
                            padding: '9px 12px',
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: 4,
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
                      <div className="font-pixel" style={{ fontSize: 10, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>
                        {selEntry ? `SESSION ${selEntry.num}` : 'SELECT A SESSION'}
                      </div>
                      <span className="font-pixel" style={{
                        fontSize: 10,
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
                        <div className="font-pixel" style={{ fontSize: 11, color: 'var(--tx,#efe6ff)', lineHeight: 1.5, margin: '12px 0 8px' }}>
                          {selEntry.title}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginBottom: 16 }}>
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
            <div>
              {/* Sub-tab toggle: Contributor / Student */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 3, border: '2px solid var(--ln,#3a3352)', borderRadius: 7, padding: 3, background: '#181324', width: 'fit-content' }}>
                <button
                  onClick={() => setShowcaseSubTab('contributor')}
                  className="font-pixel"
                  style={{ fontSize: 9, padding: '9px 16px', border: 'none', borderRadius: 5, background: showcaseSubTab === 'contributor' ? 'var(--ok,#74f0a0)' : 'transparent', color: showcaseSubTab === 'contributor' ? '#12081e' : 'var(--tx,#e4e0ee)', cursor: 'pointer' }}
                >❀ CONTRIBUTOR</button>
                <button
                  onClick={async () => {
                    setShowcaseSubTab('student');
                    if (studentShowcaseItems.length === 0) {
                      setIsLoadingStudentShowcase(true);
                      try {
                        const [engs, delivs] = await Promise.all([
                          getAllGenerations(cohortId),
                          getStudentShowcaseDeliverables(cohortId)
                        ]);
                        // Show ALL student generations (approved ones with showcase request, plus pending ones)
                        const showcaseEngs = engs.filter((e: any) => {
                          try {
                            const data = JSON.parse(e.content || '{}');
                            return data.showcaseRequested === true || data.showcaseVisible === true;
                          } catch { return false; }
                        });
                        setStudentShowcaseItems([...showcaseEngs, ...delivs]);
                      } catch (e) {
                        console.error('Failed to load student showcase', e);
                      } finally {
                        setIsLoadingStudentShowcase(false);
                      }
                    }
                  }}
                  className="font-pixel"
                  style={{ fontSize: 9, padding: '9px 16px', border: 'none', borderRadius: 5, background: showcaseSubTab === 'student' ? '#ff5fd2' : 'transparent', color: showcaseSubTab === 'student' ? '#12081e' : 'var(--tx,#e4e0ee)', cursor: 'pointer' }}
                >★ STUDENT</button>
              </div>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="font-pixel"
                  style={{ fontSize: 9, padding: '9px 16px', border: '2px solid var(--gold,#ffd23f)', borderRadius: 5, background: 'rgba(255,210,63,.1)', color: 'var(--gold,#ffd23f)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  ⚙ CONFIG
                </button>
              </div>

              {/* Student Showcase Tab */}
              {showcaseSubTab === 'student' && (
                <div style={{ border: '2px solid #ff5fd2', borderRadius: 12, padding: 24, background: 'rgba(255,95,210,.03)' }}>
                  <div className="font-pixel" style={{ fontSize: 14, color: '#ff5fd2', marginBottom: 18 }}>★ STUDENT SHOWCASE ITEMS</div>
                  {isLoadingStudentShowcase ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu,#9990ab)' }}>Loading student showcase...</div>
                  ) : studentShowcaseItems.length === 0 ? (
                    <div style={{ border: '2px dashed rgba(255,95,210,.3)', borderRadius: 8, padding: 20, textAlign: 'center', color: 'var(--mu,#9990ab)', fontSize: 16 }}>
                      No student showcase submissions yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {studentShowcaseItems.map((item: any) => {
                        const isVisible = (() => { try { const d = JSON.parse(item.content || '{}'); return d.showcaseVisible === true; } catch { return false; } })();
                        const isFormSubmission = item.source === 'Student Showcase';
                        const statusColor = item.status === 'approved' ? '#74f0a0' : item.status === 'rejected' ? '#ff8a4a' : '#ffd23f';
                        // Extract previewUrl from content JSON (set when student uploaded a preview alongside a non-media URL)
                        const itemPreviewUrl = (() => { try { const d = JSON.parse(item.content || '{}'); return d.previewUrl || null; } catch { return null; } })();
                        return (
                          <div key={item.id} style={{ border: '1.5px solid var(--ln,#3a3352)', borderRadius: 10, padding: '18px 20px', background: 'rgba(255,255,255,.02)', display: 'flex', gap: 16, alignItems: 'center' }}>
                            {/* Thumbnail */}
                            <div style={{ width: 72, height: 72, flex: 'none', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,95,210,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                              {item.url && isImageUrl(item.url) ? (
                                <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              ) : item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')) ? (
                                <>
                                  <img src={`https://img.youtube.com/vi/${item.url.includes('youtu.be/') ? item.url.split('youtu.be/')[1]?.split('?')[0] : new URLSearchParams(item.url.split('?')[1] || '').get('v')}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: 10, color: '#fff', marginLeft: 2 }}>▶</span>
                                    </div>
                                  </div>
                                </>
                              ) : item.url && /\.(mp4|webm|mov)/i.test(item.url) ? (
                                <>
                                  <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: 10, color: '#fff', marginLeft: 2 }}>▶</span>
                                    </div>
                                  </div>
                                </>
                              ) : item.url && /\.(mp3|wav|ogg|aac|flac)/i.test(item.url) ? (
                                <span style={{ fontSize: 24, color: '#ff5fd2' }}>♫</span>
                              ) : itemPreviewUrl ? (
                                <img src={itemPreviewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              ) : item.url ? (
                                <span style={{ fontSize: 20, color: '#45d6ff' }}>🔗</span>
                              ) : (
                                <span style={{ fontSize: 28, color: '#ff5fd2', opacity: 0.5 }}>✦</span>
                              )}
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 18, color: 'var(--tx,#e4e0ee)', fontWeight: 700, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                              <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>
                                {item.profiles?.full_name || 'Student'} · {item.source || item.kind || 'Generation'}
                              </div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="font-pixel" style={{ fontSize: 9, padding: '4px 10px', borderRadius: 5, background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                                  {(item.status || 'pending').toUpperCase()}
                                </span>
                                {isFormSubmission && (
                                  <span className="font-pixel" style={{ fontSize: 9, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,95,210,.15)', color: '#ff5fd2', border: '1px solid rgba(255,95,210,.3)' }}>
                                    SUBMITTED
                                  </span>
                                )}
                                {!isFormSubmission && (
                                  <span className="font-pixel" style={{ fontSize: 9, padding: '4px 10px', borderRadius: 5, background: 'rgba(153,144,171,.1)', color: '#9990ab', border: '1px solid rgba(153,144,171,.3)' }}>
                                    AUTO
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, flex: 'none', alignItems: 'center' }}>
                              {/* Toggle switch */}
                              <div
                                onClick={async () => {
                                  if (togglingItemId) return;
                                  setTogglingItemId(item.id);
                                  try {
                                    const { updateEngagement } = await import('@/app/actions/workshops/engagement');
                                    const parsed = JSON.parse(item.content || '{}');
                                    parsed.showcaseVisible = !isVisible;
                                    await updateEngagement(item.id, { content: JSON.stringify(parsed) });
                                    setStudentShowcaseItems(prev => prev.map(s => s.id === item.id ? { ...s, content: JSON.stringify(parsed) } : s));
                                  } catch (e) { console.error(e); }
                                  finally { setTogglingItemId(null); }
                                }}
                                style={{ width: 44, height: 24, borderRadius: 12, background: togglingItemId === item.id ? '#9990ab' : isVisible ? '#74f0a0' : '#3a3352', cursor: togglingItemId === item.id ? 'wait' : 'pointer', position: 'relative', transition: 'background .2s', border: '1.5px solid ' + (isVisible ? 'rgba(116,240,160,.5)' : 'rgba(153,144,171,.3)'), opacity: togglingItemId === item.id ? 0.6 : 1 }}
                                title={togglingItemId === item.id ? 'Saving...' : isVisible ? 'Visible — click to hide' : 'Hidden — click to show'}
                              >
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: isVisible ? 22 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Edit Student Showcase Modal - removed */}
                </div>
              )}

              {/* Contributor Showcase Tab (original content) */}
              {showcaseSubTab === 'contributor' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Publish form */}
              <div style={{
                border: '2px solid var(--ok,#74f0a0)',
                borderRadius: 8,
                padding: 15,
                background: 'rgba(116,240,160,.05)',
                height: 'fit-content',
              }}>
                <div className="font-pixel" style={{ fontSize: 10, color: 'var(--ok,#74f0a0)', marginBottom: 13 }}>
                  {editingShowcaseId ? '✎ EDIT CONTRIBUTOR MEDIA' : '＋ PUBLISH CONTRIBUTOR MEDIA'}
                </div>
                <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 7 }}>MEDIA TYPE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['video', 'article', 'audio', 'aigen'].map(t => (
                    <button
                      key={t}
                      onClick={() => setNcType(t)}
                      className="font-pixel"
                      style={{
                        fontSize: 10,
                        padding: '8px 14px',
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
                <input value={ncTitle} onChange={e => setNcTitle(e.target.value)} placeholder="Media title…" style={{ ...inputStyle, fontSize: 22, marginBottom: 9 }} />
                <input value={ncAuthor} onChange={e => setNcAuthor(e.target.value)} placeholder="Contributor name…" style={{ ...inputStyle, fontSize: 22, marginBottom: 9 }} />
                <div style={{ marginBottom: 9 }}>
                  <input 
                    value={ncEmail} 
                    onChange={e => setNcEmail(e.target.value)} 
                    placeholder="Contributor email (optional)…" 
                    type="email" 
                    style={{ ...inputStyle, fontSize: 22, marginBottom: 4 }} 
                  />
                  <div style={{ fontSize: 13, color: 'var(--s,#8aa6c4)', paddingLeft: 4, lineHeight: 1.3 }}>
                    ✉ When provided, sends an invitation email with guest access
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 9 }}>
                  {ncLink.startsWith('blob:') ? (
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      ...inputStyle,
                      fontSize: 22,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 11px',
                    }}>
                      {ncFileToUpload?.type.startsWith('image/') ? (
                        <img src={ncLink} alt="" style={{ height: 28, width: 28, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--ln,#3d2668)' }} />
                      ) : ncFileToUpload?.type.startsWith('video/') ? (
                        <span style={{ fontSize: 18 }}>🎬</span>
                      ) : (
                        <span style={{ fontSize: 18 }}>🎵</span>
                      )}
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 16 }}>
                        {ncFileToUpload?.name || 'Uploaded File'}
                      </span>
                      <button onClick={() => { setNcLink(''); setNcFileToUpload(null) }} style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  ) : (
                    <input value={ncLink} onChange={e => setNcLink(e.target.value)} placeholder="Public share link / creation ID…" style={{ ...inputStyle, fontSize: 22, flex: 1 }} />
                  )}
                  <input type="file" accept="image/*,video/*,audio/*" hidden ref={ncFileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setNcFileToUpload(file)
                    setNcLink(URL.createObjectURL(file))
                    if (ncFileInputRef.current) ncFileInputRef.current.value = ''
                  }} />
                  <button
                    onClick={() => ncFileInputRef.current?.click()}
                    className="font-pixel"
                    style={{
                      fontSize: 9,
                      background: 'transparent',
                      border: '2px solid var(--s,#45d6ff)',
                      color: 'var(--s,#45d6ff)',
                      borderRadius: 4,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ↑ UPLOAD
                  </button>
                </div>

                {ncLink.trim() && !ncLink.startsWith('blob:') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <input type="file" accept="image/*" hidden ref={ncPreviewFileInputRef} onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setNcPreviewFile(file)
                      setNcPreviewObjectUrl(URL.createObjectURL(file))
                      if (ncPreviewFileInputRef.current) ncPreviewFileInputRef.current.value = ''
                    }} />
                    <button
                      onClick={() => ncPreviewFileInputRef.current?.click()}
                      disabled={isUploadingNcFile}
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
                    {ncPreviewObjectUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img
                          src={ncPreviewObjectUrl}
                          alt="Preview"
                          style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--pk,#ff5fd2)' }}
                        />
                        <span style={{ fontSize: 12, color: 'var(--mu,#a493c9)', display: 'inline-block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ncPreviewFile?.name || 'Preview'}</span>
                        <button
                          onClick={() => { setNcPreviewFile(null); if (ncPreviewObjectUrl) URL.revokeObjectURL(ncPreviewObjectUrl); setNcPreviewObjectUrl(null) }}
                          style={{ background: 'none', border: 'none', color: 'var(--mu,#a493c9)', cursor: 'pointer', fontSize: 13, padding: 2 }}
                        >✕</button>
                      </div>
                    )}
                  </div>
                )}
                <input value={ncMeta} onChange={e => setNcMeta(e.target.value)} placeholder="Duration / word count (e.g., 8:24 · Video)…" style={{ ...inputStyle, fontSize: 22, marginBottom: 9 }} />
                <textarea 
                  value={ncBlurb} 
                  onChange={e => setNcBlurb(e.target.value)} 
                  placeholder="Description / blurb for students…" 
                  rows={3}
                  style={{ ...textareaStyle, fontSize: 22, marginBottom: 12 }} 
                />

                {/* Project Type Dropdown */}
                <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>PROJECT TYPE</div>
                <select
                  value={ncProjectType}
                  onChange={e => setNcProjectType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.35)',
                    border: `2px solid ${ncProjectType ? 'var(--ok,#74f0a0)' : 'var(--ln,#3d2668)'}`,
                    borderRadius: 6,
                    color: ncProjectType ? 'var(--tx,#efe6ff)' : 'var(--mu,#a493c9)',
                    fontSize: 16,
                    padding: '8px 10px',
                    marginBottom: 12,
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a493c9' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    paddingRight: 32,
                  }}
                >
                  <option value="" style={{ background: 'var(--bg,#14101f)', color: 'var(--tx,#efe6ff)' }}>— Select project type (optional) —</option>
                  <option value="creative_ai" style={{ background: 'var(--bg,#14101f)', color: 'var(--tx,#efe6ff)' }}>A · Creative Projects Made with AI</option>
                  <option value="workplace_freelance" style={{ background: 'var(--bg,#14101f)', color: 'var(--tx,#efe6ff)' }}>B · AI in the Workplace &amp; Freelancing</option>
                  <option value="nature_local" style={{ background: 'var(--bg,#14101f)', color: 'var(--tx,#efe6ff)' }}>C · Nature, Local Landscapes &amp; Resource Use</option>
                  <option value="digital_sovereignty" style={{ background: 'var(--bg,#14101f)', color: 'var(--tx,#efe6ff)' }}>D · Digital Sovereignty, Rules &amp; Ethics</option>
                  <option value="digital_wellness" style={{ background: 'var(--bg,#14101f)', color: 'var(--tx,#efe6ff)' }}>E · Digital Wellness &amp; Human Connection</option>
                </select>
                <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>
                  CONTRIBUTOR STATUS · <span style={{ opacity: .75 }}>admin-only, hidden from students</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <button
                    onClick={() => setNcPaid(true)}
                    className="font-pixel"
                    style={{
                      fontSize: 10,
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
                      fontSize: 10,
                      padding: '8px 14px',
                      border: `2px solid ${!ncPaid ? 'var(--ok,#74f0a0)' : 'var(--ln,#3d2668)'}`,
                      borderRadius: 6,
                      background: !ncPaid ? 'rgba(116,240,160,.1)' : 'rgba(0,0,0,.3)',
                      color: !ncPaid ? 'var(--ok,#74f0a0)' : 'var(--mu,#a493c9)',
                      cursor: 'pointer',
                    }}
                  >FREE</button>
                </div>
                <div style={{ fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 13, lineHeight: 1.4 }}>
                  Files into the Steward Library under <span style={{ color: 'var(--s,#45d6ff)' }}>◈ How to Use AI</span> and appears in the student Showcase (no price shown).
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handlePublishContributor}
                    disabled={isSaving || !ncTitle.trim()}
                    className="font-pixel"
                    style={{
                      flex: 1,
                      fontSize: 10,
                      color: 'var(--bg,#12081e)',
                      background: isSaving || !ncTitle.trim() ? 'var(--mu,#a493c9)' : 'var(--ok,#74f0a0)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '12px 14px',
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
                        fontSize: 10,
                        color: 'var(--mu,#a493c9)',
                        background: 'transparent',
                        border: '2px solid var(--mu,#a493c9)',
                        borderRadius: 4,
                        padding: '12px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      CANCEL
                    </button>
                  )}
                </div>
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
                      {/* Media thumbnail or type icon */}
                      {(() => {
                        // Extract previewUrl from content JSON
                        let contentPreviewUrl: string | null = null;
                        try { const d = JSON.parse(item.meta || '{}'); contentPreviewUrl = d.previewUrl || null; } catch {}
                        return item.url && (isImageUrl(item.url) || item.url.match(/\.(mp4|webm|mov)/i)) ? (
                          <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 6,
                            overflow: 'hidden',
                            flex: 'none',
                            position: 'relative',
                            background: 'rgba(0,0,0,.3)',
                            border: '1px solid var(--ln,#3a3352)',
                          }}>
                            {isImageUrl(item.url) ? (
                              <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <>
                                <video src={item.url} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 14, color: '#fff', background: 'rgba(0,0,0,.5)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : contentPreviewUrl ? (
                          <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flex: 'none', background: 'rgba(0,0,0,.3)', border: '1px solid var(--ln,#3a3352)' }}>
                            <img src={contentPreviewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          </div>
                        ) : (
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
                        );
                      })()}
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

              {/* Settings Modal */}
              {showConfigModal && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: 20
                }}>
                  <div style={{
                    border: '2px solid var(--gold,#ffd23f)',
                    borderRadius: 12,
                    padding: 24,
                    background: '#1a1625',
                    width: '100%',
                    maxWidth: 500,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    position: 'relative'
                  }}>
                    <button
                      onClick={() => setShowConfigModal(false)}
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'none',
                        border: 'none',
                        color: 'var(--mu,#a493c9)',
                        fontSize: 20,
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                    <div className="font-pixel" style={{ fontSize: 12, color: 'var(--gold,#ffd23f)', marginBottom: 20 }}>
                      ⚙ SHOWCASE CONFIG
                    </div>
                    <div className="font-vt323" style={{ fontSize: 20, color: 'var(--mu,#a493c9)', marginBottom: 10 }}>TALLY FORM LINK</div>
                    <input 
                      value={showcaseSettings?.tally_link || ''} 
                      onChange={e => setShowcaseSettings({...showcaseSettings, tally_link: e.target.value})} 
                      placeholder="https://tally.so/r/..." 
                      style={{ ...inputStyle, fontSize: 18, marginBottom: 12 }} 
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--tx,#d6ffe0)', marginBottom: 24, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!showcaseSettings?.show_tally_link} onChange={e => setShowcaseSettings({...showcaseSettings, show_tally_link: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--gold,#ffd23f)' }} />
                      Enable Tally Button in Contributor Tab
                    </label>
                    <button
                      onClick={async () => {
                        setIsSavingSettings(true);
                        await updateShowcaseSettings(showcaseSettings);
                        setToast('✓ Settings updated');
                        setIsSavingSettings(false);
                        setShowConfigModal(false);
                      }}
                      disabled={isSavingSettings}
                      className="font-pixel"
                      style={{ fontSize: 11, padding: '12px 20px', background: 'var(--gold,#ffd23f)', color: '#0e1512', border: 'none', borderRadius: 5, cursor: isSavingSettings ? 'wait' : 'pointer', width: '100%' }}
                    >
                      {isSavingSettings ? 'SAVING...' : 'SAVE CONFIG'}
                    </button>
                  </div>
                </div>
              )}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-pixel" style={{ fontSize: 13, color: 'var(--tx,#e4e0ee)', letterSpacing: 1 }}>
                    ☑ APPROVALS
                  </div>
                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: 'var(--mu,#9990ab)', marginTop: 8, maxWidth: 560, lineHeight: 1.45 }}>
                    Grow each learner's Chia Guardian. <span style={{ color: '#c9a85f' }}>Deliverables</span> add 25% (max 75%); <span style={{ color: '#86b89a' }}>engagement</span> adds 1–3% (max 25%). Read the queue as a <strong>log</strong> or by <strong>steward</strong>.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      setShowHistory(true);
                      setIsLoadingHistory(true);
                      try {
                        const [allSubs, allEngs] = await Promise.all([
                          getSubmissionsForReview(cohortId, 'all'),
                          getAllEngagementsHistory(cohortId)
                        ]);
                        const merged = [...allSubs, ...allEngs].sort(
                          (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                        );
                        setHistoryItems(merged);
                      } catch (e) {
                        console.error('Failed to load history', e);
                      } finally {
                        setIsLoadingHistory(false);
                      }
                    }}
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: '8px',
                      padding: '8px 14px',
                      border: showHistory ? '2px solid #ff5fd2' : '2px solid var(--ln,#3a3352)',
                      borderRadius: 7,
                      background: showHistory ? '#ff5fd2' : '#181324',
                      color: showHistory ? '#12081e' : 'var(--tx,#e4e0ee)',
                      cursor: 'pointer',
                    }}
                  >⏱ HISTORY</button>
                  <button 
                    onClick={async () => {
                      setShowHistory(false);
                      setIsLoadingApprovals(true);
                      try {
                        const [subs, engs, progress] = await Promise.all([
                          getSubmissionsForReview(cohortId, 'submitted'),
                          getPendingEngagements(cohortId),
                          getParticipantsProgress(cohortId)
                        ]);
                        const allPending = [...subs, ...engs].sort(
                          (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                        );
                        setPendingSubmissions(allPending);
                        setParticipantsProgress(progress);
                      } catch (e) {
                        console.error('Failed to load approvals', e);
                      } finally {
                        setIsLoadingApprovals(false);
                      }
                    }}
                    style={{
                      fontFamily: "'VT323'",
                      fontSize: 18,
                      letterSpacing: '.5px',
                      color: !showHistory ? '#141019' : 'var(--gold,#c9a85f)',
                      background: !showHistory ? 'var(--gold,#c9a85f)' : 'transparent',
                      border: !showHistory ? '2px solid var(--gold,#c9a85f)' : '2px solid var(--ln,#3a3352)',
                      borderRadius: 20,
                      padding: '4px 14px',
                      cursor: 'pointer'
                    }}
                  >{pendingSubmissions.length} PENDING</button>
                  <div style={{ display: 'flex', gap: 3, border: '2px solid var(--ln,#3a3352)', borderRadius: 7, padding: 3, background: '#181324', marginLeft: 'auto' }}>
                    <button
                      onClick={() => { setShowHistory(false); setApprovalView('log'); }}
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '8px',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 5,
                        background: !showHistory && approvalView === 'log' ? 'var(--gold,#ffd23f)' : 'transparent',
                        color: !showHistory && approvalView === 'log' ? '#12081e' : 'var(--tx,#e4e0ee)',
                        cursor: 'pointer',
                      }}
                    >▤ LOG</button>
                    <button
                      onClick={() => { setShowHistory(false); setApprovalView('steward'); }}
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: '8px',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 5,
                        background: !showHistory && approvalView === 'steward' ? 'var(--gold,#ffd23f)' : 'transparent',
                        color: !showHistory && approvalView === 'steward' ? '#12081e' : 'var(--tx,#e4e0ee)',
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
                  { id: 'all', label: 'ALL', color: 'var(--tx,#e4e0ee)', count: showHistory ? historyItems.length : pendingSubmissions.length },
                  { id: 'deliverables', label: 'DELIVERABLES', color: 'var(--gold,#c9a85f)', count: showHistory ? historyItems.filter(s => !!s.workshop_day_id).length : pendingSubmissions.filter(s => !!s.workshop_day_id).length },
                  { id: 'mini_deliverables', label: 'MINI DEL.', color: '#7c5cbf', count: showHistory ? historyItems.filter(s => !s.workshop_day_id && s.kind === 'mini_deliverable').length : pendingSubmissions.filter(s => !s.workshop_day_id && s.kind === 'mini_deliverable').length },
                  { id: 'engagement', label: 'ENGAGEMENT', color: 'var(--ok,#86b89a)', count: showHistory ? historyItems.filter(s => !s.workshop_day_id && s.kind !== 'mini_deliverable').length : pendingSubmissions.filter(s => !s.workshop_day_id && s.kind !== 'mini_deliverable').length }
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
              {showHistory ? (
                /* ═══ HISTORY VIEW ═══ */
                isLoadingHistory ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--mu,#9990ab)' }}>Loading history...</div>
                ) : historyItems.length === 0 ? (
                  <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: 'var(--mu,#9990ab)' }}>
                    No history items found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {historyItems.filter(item => {
                      if (approvalFilter === 'deliverables') return !!item.workshop_day_id
                      if (approvalFilter === 'mini_deliverables') return !item.workshop_day_id && item.kind === 'mini_deliverable'
                      if (approvalFilter === 'engagement') return !item.workshop_day_id && item.kind !== 'mini_deliverable'
                      return true
                    }).map(item => {
                      const isDeliverable = !!item.workshop_day_id
                      const statusColor = item.deliverable_status === 'approved' ? '#74f0a0' : item.deliverable_status === 'rejected' ? '#ff8a4a' : item.deliverable_status === 'pending' ? '#ffd23f' : '#9990ab'
                      const statusLabel = (item.deliverable_status || 'unknown').toUpperCase()
                      return (
                        <div key={item.id} style={{ border: '1.5px solid var(--ln,#3a3352)', borderRadius: 10, padding: '18px 20px', background: 'rgba(255,255,255,.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                                <span className="font-pixel" style={{ fontSize: 9, padding: '4px 10px', borderRadius: 5, background: isDeliverable ? 'rgba(201,168,95,.2)' : (item.kind === 'mini_deliverable' ? 'rgba(124,92,191,.2)' : 'rgba(134,184,154,.2)'), color: isDeliverable ? '#c9a85f' : (item.kind === 'mini_deliverable' ? '#7c5cbf' : '#86b89a'), border: `1px solid ${isDeliverable ? 'rgba(201,168,95,.3)' : (item.kind === 'mini_deliverable' ? 'rgba(124,92,191,.3)' : 'rgba(134,184,154,.3)')}` }}>
                                  {isDeliverable ? 'DELIVERABLE' : (item.kind === 'mini_deliverable' ? 'MINI DEL.' : 'ENGAGEMENT')}
                                </span>
                                <span className="font-pixel" style={{ fontSize: 9, padding: '4px 10px', borderRadius: 5, background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                                  {statusLabel}
                                </span>
                              </div>
                              <div style={{ fontSize: 18, color: 'var(--tx,#e4e0ee)', fontWeight: 700, marginBottom: 6 }}>{item.title || item.day_title || 'Untitled'}</div>
                              <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>
                                {item.participant_name} · {item.source || (isDeliverable ? 'Workshop' : item.kind)} · {new Date(item.submitted_at).toLocaleDateString()}
                              </div>
                              {item.review_note && (
                                <div style={{ marginTop: 8, fontSize: 14, color: '#a493c9', fontStyle: 'italic' }}>Note: {item.review_note}</div>
                              )}
                            </div>
                            {/* Status change buttons */}
                            <div style={{ display: 'flex', gap: 8, flex: 'none', alignItems: 'center' }}>
                              {item.deliverable_status !== 'approved' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      if (isDeliverable) {
                                        await reviewDeliverable(item.progress_id || item.id, 'approved', reviewNotes[item.id]);
                                      } else {
                                        await reviewEngagement(item.id, 'approved', reviewNotes[item.id]);
                                      }
                                      setHistoryItems(prev => prev.map(h => h.id === item.id ? { ...h, deliverable_status: 'approved' } : h));
                                    } catch (e) { console.error(e); }
                                  }}
                                  className="font-pixel"
                                  style={{ fontSize: 9, padding: '9px 14px', background: 'rgba(116,240,160,.15)', color: '#74f0a0', border: '1.5px solid rgba(116,240,160,.4)', borderRadius: 6, cursor: 'pointer' }}
                                >✓ APPROVE</button>
                              )}
                              {item.deliverable_status !== 'rejected' && item.deliverable_status !== 'pending' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      if (isDeliverable) {
                                        await reviewDeliverable(item.progress_id || item.id, 'rejected', reviewNotes[item.id]);
                                      } else {
                                        await reviewEngagement(item.id, 'rejected', reviewNotes[item.id]);
                                      }
                                      setHistoryItems(prev => prev.map(h => h.id === item.id ? { ...h, deliverable_status: 'rejected' } : h));
                                    } catch (e) { console.error(e); }
                                  }}
                                  className="font-pixel"
                                  style={{ fontSize: 9, padding: '9px 14px', background: 'rgba(255,138,74,.1)', color: '#ff8a4a', border: '1.5px solid rgba(255,138,74,.4)', borderRadius: 6, cursor: 'pointer' }}
                                >↩ RETURN</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : isLoadingApprovals ? (
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
                    if (approvalFilter === 'mini_deliverables') return !sub.workshop_day_id && sub.kind === 'mini_deliverable'
                    if (approvalFilter === 'engagement') return !sub.workshop_day_id && sub.kind !== 'mini_deliverable'
                    return true
                  }).length === 0 ? (
                    <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 16, color: 'var(--mu,#9990ab)' }}>
                      All caught up — nothing matches this filter.
                    </div>
                  ) : pendingSubmissions.filter(sub => {
                    if (approvalFilter === 'deliverables') return !!sub.workshop_day_id
                    if (approvalFilter === 'mini_deliverables') return !sub.workshop_day_id && sub.kind === 'mini_deliverable'
                    if (approvalFilter === 'engagement') return !sub.workshop_day_id && sub.kind !== 'mini_deliverable'
                    return true
                  }).map(sub => {
                    const isDeliverable = !!sub.workshop_day_id
                    const tagColor = isDeliverable ? '#c9a85f' : (sub.kind === 'mini_deliverable' ? '#7c5cbf' : '#86b89a')
                    const tagLabel = isDeliverable ? 'DELIVERABLE' : (sub.kind === 'mini_deliverable' ? 'MINI DEL.' : 'ENGAGEMENT')
                    const approveLabel = isDeliverable ? '✓ APPROVE +25%' : (sub.kind === 'mini_deliverable' ? '✓ APPROVE +4%' : '✓ APPROVE')
                    
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: '1 1 auto', minWidth: 200 }}>
                            <div className="font-pixel" style={{
                              fontSize: 8,
                              color: tagColor,
                              border: `1px solid ${tagColor}`,
                              borderRadius: 20,
                              padding: '4px 8px',
                              letterSpacing: 1,
                              flex: 'none',
                              marginTop: 2,
                              whiteSpace: 'nowrap',
                            }}>
                              {tagLabel}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontFamily: "'VT323', monospace", fontSize: 18, color: 'var(--tx,#e4e0ee)', letterSpacing: 0.5, lineHeight: 1.2 }}>
                                {title}
                              </div>
                              <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: 'var(--mu,#9990ab)', lineHeight: 1.2, marginTop: 2 }}>
                                {subtitle}
                              </div>
                            </div>
                          </div>
                          
                          {(() => {
                            const rawText = sub.content || sub.submission_text || '';
                            let isShowcaseRequested = rawText.includes('[SHOWCASE_REQUESTED]');
                            
                            // Also check JSON content field for AI Lab submissions
                            if (!isShowcaseRequested && rawText.startsWith('{')) {
                              try {
                                const parsed = JSON.parse(rawText);
                                if (parsed.showcaseRequested === true) {
                                  isShowcaseRequested = true;
                                }
                              } catch (e) { /* not JSON, ignore */ }
                            }
                            
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
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', flex: 'none' }}>
                                <div className="font-pixel" style={{
                                  fontSize: 8,
                                  color: '#c9a85f',
                                  border: '1px solid #c9a85f',
                                  borderRadius: 20,
                                  padding: '4px 8px',
                                  letterSpacing: 1,
                                  whiteSpace: 'nowrap',
                                }}>
                                  PENDING
                                </div>
                                  
                                {principleName && (
                                  <div className="font-pixel" style={{
                                    fontSize: 8, color: 'var(--ok,#74f0a0)', border: '1px solid var(--ok,#74f0a0)',
                                    borderRadius: 20, padding: '4px 8px', letterSpacing: 1, 
                                    whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '300px', lineHeight: '1.4', textAlign: 'right'
                                  }}>
                                    ◈ {principleName.toUpperCase()}
                                  </div>
                                )}
                                  
                                {isShowcaseRequested && (
                                  <div className="font-pixel" style={{
                                    fontSize: 8, color: '#101613', border: 'none',
                                    borderRadius: 20, padding: '4px 8px', letterSpacing: 1,
                                    background: 'var(--pk,#ff5fd2)',
                                    display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                                  }}>
                                    <span style={{ fontSize: 9 }}>↺</span> WANTS SHOWCASE
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Content/URL display with proper wrapping */}
                        {(() => {
                          const rawText = sub.content || sub.submission_text || '';
                          
                          // 1. Check for Version 2 JSON format (Rich Text & Images)
                          try {
                            const parsed = JSON.parse(rawText);
                            if (parsed && parsed.version === 2) {
                              return (
                                <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                  {parsed.html ? (
                                    <div style={{ fontFamily: 'inherit', fontSize: 15, color: 'var(--tx,#e4e0ee)', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: parsed.html }} />
                                  ) : parsed.text ? (
                                    <div style={{ fontFamily: 'inherit', fontSize: 15, color: 'var(--tx,#e4e0ee)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{parsed.text}</div>
                                  ) : null}
                                  
                                  {parsed.images && parsed.images.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                      {parsed.images.map((img: string, idx: number) => (
                                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: 140, height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' }}>
                                          <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Attachment" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          } catch {}

                          let cleanText = rawText.replace('[SHOWCASE_REQUESTED]', '').trim();
                          let principleMatch = cleanText.match(/Selected Principle ID: ([a-zA-Z0-9-]+)/);
                          if (principleMatch) {
                            cleanText = cleanText.replace(principleMatch[0], '').trim();
                          }
                          
                          // For deliverables, also check external_video_url
                          const displayUrl = sub.url || sub.external_video_url || cleanText;
                          
                          // Extract previewUrl and description from content JSON
                          let previewUrl: string | null = null;
                          let description: string | null = null;
                          try {
                            const parsed = JSON.parse(rawText);
                            previewUrl = parsed.previewUrl || null;
                            description = parsed.description || null;
                          } catch {}

                          if (!displayUrl && !previewUrl && (!rawText || rawText.trim() === '')) return null;

                          // If we have a previewUrl alongside a non-media link, render custom preview
                          const isMediaUrl = displayUrl && (isImageUrl(displayUrl) || displayUrl.includes('youtube.com') || displayUrl.includes('youtu.be') || /\.(mp4|webm|mov|mp3|wav|ogg|aac|flac)/i.test(displayUrl));
                          
                          if (previewUrl && !isMediaUrl) {
                            return (
                              <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {/* Inline row: small thumbnail + link */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {/* Small preview thumbnail — click to open full size */}
                                  <div
                                    onClick={() => window.open(previewUrl!, '_blank')}
                                    title="Click to view full preview image"
                                    style={{ cursor: 'pointer', flex: 'none', width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1.5px solid rgba(255,95,210,.35)', position: 'relative', background: 'rgba(255,95,210,.08)' }}
                                  >
                                    <img
                                      src={previewUrl}
                                      alt="Preview"
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.0)', transition: 'background .15s' }}>
                                      <span style={{ fontSize: 10, color: '#fff', opacity: 0.7 }}>🔍</span>
                                    </div>
                                  </div>
                                  {/* Link */}
                                  {displayUrl && (
                                    <a href={displayUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'VT323', monospace", fontSize: 15, color: '#45d6ff', wordBreak: 'break-all', lineHeight: 1.3 }}>
                                      🔗 {displayUrl}
                                    </a>
                                  )}
                                </div>
                                {description && (
                                  <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: 'var(--mu,#9990ab)', fontStyle: 'italic' }}>
                                    {description}
                                  </div>
                                )}
                              </div>
                            );
                          }

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
                              <DeliverableMediaPreview
                                url={displayUrl}
                                variant="thumbnail"
                                theme="dark"
                                showPreviewButton={true}
                                maxThumbnailSize={56}
                              />
                              {description && (
                                <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: 'var(--mu,#9990ab)', marginTop: 6, fontStyle: 'italic' }}>
                                  {description}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Bottom row: Buttons (flush left) */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            onClick={() => handleReview(reviewId, 'approved', reviewNotes[reviewId], !isDeliverable)}
                            disabled={!!reviewingIds[reviewId]}
                            style={{
                              fontFamily: "'VT323', monospace",
                              fontSize: 16,
                              padding: '4px 12px',
                              border: '1px solid #86b89a',
                              borderRadius: 6,
                              background: '#86b89a',
                              color: '#12081e',
                              cursor: reviewingIds[reviewId] ? 'wait' : 'pointer',
                              letterSpacing: 0.5,
                              opacity: reviewingIds[reviewId] ? 0.6 : 1,
                            }}
                          >
                            {reviewingIds[reviewId] === 'approving' ? '⏳ Approving...' : approveLabel}
                          </button>
                          
                          <button
                            onClick={() => handleReview(reviewId, 'rejected', reviewNotes[reviewId] || 'Needs more work', !isDeliverable)}
                            disabled={!!reviewingIds[reviewId]}
                            style={{
                              fontFamily: "'VT323', monospace",
                              fontSize: 16,
                              padding: '4px 12px',
                              border: '1px solid #c9a85f',
                              borderRadius: 6,
                              background: 'transparent',
                              color: '#c9a85f',
                              cursor: reviewingIds[reviewId] ? 'wait' : 'pointer',
                              letterSpacing: 0.5,
                              opacity: reviewingIds[reviewId] ? 0.6 : 1,
                            }}
                          >
                            {reviewingIds[reviewId] === 'rejecting' ? '⏳ Returning...' : '↩ RETURN'}
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
                      if (approvalFilter === 'mini_deliverables') return !sub.workshop_day_id && sub.kind === 'mini_deliverable'
                      if (approvalFilter === 'engagement') return !sub.workshop_day_id && sub.kind !== 'mini_deliverable'
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
                                          <button disabled={!!reviewingIds[reviewId]} onClick={() => handleReview(reviewId, 'approved', reviewNotes[reviewId], false)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: '#141019', background: 'var(--ok,#86b89a)', border: 'none', borderRadius: 5, padding: '6px 12px', cursor: reviewingIds[reviewId] ? 'wait' : 'pointer', opacity: reviewingIds[reviewId] ? 0.6 : 1 }}>{reviewingIds[reviewId] === 'approving' ? '⏳ Approving...' : '✓ APPROVE +25%'}</button>
                                          <button disabled={!!reviewingIds[reviewId]} onClick={() => handleReview(reviewId, 'rejected', reviewNotes[reviewId], false)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: 'var(--mu,#9990ab)', background: 'none', border: '2px solid var(--ln,#3a3352)', borderRadius: 5, padding: '5px 11px', cursor: reviewingIds[reviewId] ? 'wait' : 'pointer', opacity: reviewingIds[reviewId] ? 0.6 : 1 }}>{reviewingIds[reviewId] === 'rejecting' ? '⏳ Returning...' : '↩ RETURN'}</button>
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
                                          <span className="font-pixel" style={{ fontSize: 8, color: e.kind === 'mini_deliverable' ? '#7c5cbf' : '#86b89a', border: `1px solid ${e.kind === 'mini_deliverable' ? '#7c5cbf' : '#86b89a'}`, borderRadius: 3, padding: '2px 6px' }}>{e.kind === 'mini_deliverable' ? 'MINI DEL.' : (e.kind || 'note').toUpperCase()}</span>
                                          <span style={{ fontSize: 17, color: 'var(--tx,#e4e0ee)', lineHeight: 1.2, flex: 1, minWidth: 0 }}>{e.title || 'Engagement'}</span>
                                        </div>
                                        <div style={{ fontSize: 14, color: 'var(--mu,#9990ab)', marginBottom: 9 }}>{e.source || 'Engagement'} · {dateStr}</div>
                                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                          <button disabled={!!reviewingIds[reviewId]} onClick={() => handleReview(reviewId, 'approved', reviewNotes[reviewId], true)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: '#141019', background: e.kind === 'mini_deliverable' ? '#7c5cbf' : 'var(--ok,#86b89a)', border: 'none', borderRadius: 5, padding: '6px 12px', cursor: reviewingIds[reviewId] ? 'wait' : 'pointer', opacity: reviewingIds[reviewId] ? 0.6 : 1 }}>{reviewingIds[reviewId] === 'approving' ? '⏳ Approving...' : (e.kind === 'mini_deliverable' ? '✓ APPROVE +4%' : '✓ APPROVE')}</button>
                                          <button disabled={!!reviewingIds[reviewId]} onClick={() => handleReview(reviewId, 'rejected', reviewNotes[reviewId], true)} style={{ fontFamily: "'VT323'", fontSize: 16, letterSpacing: '.5px', color: 'var(--mu,#9990ab)', background: 'none', border: '2px solid var(--ln,#3a3352)', borderRadius: 5, padding: '5px 11px', cursor: reviewingIds[reviewId] ? 'wait' : 'pointer', opacity: reviewingIds[reviewId] ? 0.6 : 1 }}>{reviewingIds[reviewId] === 'rejecting' ? '⏳ Returning...' : '↩ RETURN'}</button>
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

          {/* ═══════════════ USER PROGRESS ═══════════════ */}
          {section === 'progress' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, justifyContent: 'space-between', margin: '0 2px 10px' }}>
                <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>▣ USER PROGRESS</div>
                <div style={{ fontSize: 18, color: 'var(--mu,#9990ab)' }}>{progressData.length} stewards enrolled</div>
              </div>
              <div style={{ border: '2px solid var(--ln,#3a3352)', borderRadius: 9, background: '#201a30', padding: '14px 15px' }}>
                <div style={{ fontSize: 20, color: 'var(--mu,#9990ab)', lineHeight: 1.4, marginBottom: 14, maxWidth: 720 }}>
                  Each steward's journey at a glance — deliverables approved, engagement earned, and their chia companion's growth stage.
                </div>

                {/* Cohort Selector */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14, padding: '10px 12px', border: '1px solid var(--ln,#3a3352)', borderRadius: 7, background: 'rgba(0,0,0,.2)' }}>
                  <span style={{ fontSize: 18, color: 'var(--mu,#9990ab)', whiteSpace: 'nowrap' }}>Cohort:</span>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => { setSelectedCohortId(e.target.value); setProgressPage(1); setProgressSearch(''); }}
                    style={{
                      flex: 1,
                      minWidth: 180,
                      background: 'rgba(0,0,0,.4)',
                      border: '2px solid var(--ln,#3a3352)',
                      borderRadius: 5,
                      color: 'var(--tx,#e4e0ee)',
                      fontSize: 18,
                      padding: '8px 10px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {allCohorts.length === 0 && (
                      <option value={selectedCohortId}>{cohortName || 'Current Cohort'}</option>
                    )}
                    {allCohorts.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.status === 'open' ? '(Active)' : c.status === 'completed' ? '(Completed)' : `(${c.status})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search bar */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    value={progressSearch}
                    onChange={(e) => { setProgressSearch(e.target.value); setProgressPage(1); }}
                    placeholder="Search by name or email…"
                    style={{ width: '100%', background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln,#3a3352)', borderRadius: 6, color: 'var(--tx,#e4e0ee)', fontSize: 18, padding: '10px 13px', outline: 'none' }}
                  />
                </div>

                {isLoadingProgress || isLoadingCohortProgress ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mu,#9990ab)', fontSize: 14 }}>
                    Loading progress...
                  </div>
                ) : progressData.length === 0 ? (
                  <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: 'var(--mu,#9990ab)' }}>
                    No participants registered yet.
                  </div>
                ) : (() => {
                  const filtered = progressData.filter((s: any) => {
                    if (!progressSearch.trim()) return true
                    const q = progressSearch.toLowerCase()
                    return s.name?.toLowerCase().includes(q)
                  })
                  const totalPages = Math.ceil(filtered.length / PROGRESS_PER_PAGE)
                  const paginated = filtered.slice((progressPage - 1) * PROGRESS_PER_PAGE, progressPage * PROGRESS_PER_PAGE)

                  return (
                    <>
                      {filtered.length === 0 ? (
                        <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: 'var(--mu,#9990ab)' }}>
                          No users match "{progressSearch}"
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {paginated.map((student: any) => {
                            const char = userCharacters[student.profileId]
                            const chiaStage = student.totalPct >= 75 ? 3 : student.totalPct >= 50 ? 2 : student.totalPct >= 25 ? 1 : 0
                            const stageLabels = ['Seed', 'Sprout', 'Bloom', 'Flourish']
                            const chiaLevel = Math.min(chiaStage + 1, 3)

                            return (
                              <div
                                key={student.profileId}
                                style={{
                                  border: '2px solid var(--ln,#3a3352)',
                                  borderRadius: 10,
                                  background: 'rgba(0,0,0,.22)',
                                  padding: '18px 20px',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 16,
                                  alignItems: 'center',
                                }}
                              >
                                {/* Avatar / Chia */}
                                <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  {char ? (
                                    <PixelSprite
                                      characterKey={char.character_key || 'nayeli'}
                                      accent={char.accent_color || '#c98bad'}
                                      opts={{
                                        tint: char.tint,
                                        hair: char.hair,
                                        hairColor: char.hair_color,
                                        facial: char.facial,
                                        outfit: char.outfit,
                                        headgear: char.headgear,
                                        gear: char.loadout,
                                      }}
                                      size={42}
                                    />
                                  ) : (
                                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--ln,#3a3352)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: 18 }}>🌱</span>
                                    </div>
                                  )}
                                </div>

                                {/* Name + progress */}
                                <div style={{ flex: 1, minWidth: 180 }}>
                                  <div style={{ fontSize: 22, color: 'var(--tx,#e4e0ee)', fontWeight: 600, marginBottom: 8 }}>
                                    {student.name}
                                    {char?.player_name && <span style={{ fontSize: 18, color: 'var(--mu,#9990ab)', marginLeft: 8 }}>"{char.player_name}"</span>}
                                  </div>

                                  {/* Overall progress bar */}
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                      <span style={{ fontSize: 16, color: 'var(--mu,#9990ab)' }}>Overall Progress</span>
                                      <span className="font-pixel" style={{ fontSize: 12, color: 'var(--gold,#ffd23f)' }}>{student.totalPct}%</span>
                                    </div>
                                    <div style={{ height: 8, background: 'rgba(0,0,0,.4)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--ln,#3a3352)' }}>
                                      <div style={{ height: '100%', width: `${student.totalPct}%`, background: 'linear-gradient(90deg, #4dffa0, #ffd23f)', borderRadius: 4, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                  </div>

                                  {/* Breakdown bars */}
                                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 120 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                        <span style={{ fontSize: 15, color: '#ff5fd2' }}>Deliverables</span>
                                        <span style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>{student.approvedDelivs}/3</span>
                                      </div>
                                      <div style={{ height: 5, background: 'rgba(0,0,0,.4)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(student.delivPct / 75) * 100}%`, background: '#ff5fd2', borderRadius: 3 }}></div>
                                      </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 120 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                        <span style={{ fontSize: 15, color: '#45d6ff' }}>Engagement</span>
                                        <span style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>{student.engPct}/25</span>
                                      </div>
                                      <div style={{ height: 5, background: 'rgba(0,0,0,.4)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(student.engPct / 25) * 100}%`, background: '#45d6ff', borderRadius: 3 }}></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Chia stage badge */}
                                <div style={{ flex: 'none', textAlign: 'center' }}>
                                  <div style={{
                                    width: 50, height: 50,
                                    borderRadius: '50%',
                                    border: `2px solid ${chiaStage >= 3 ? '#ffd23f' : chiaStage >= 2 ? '#4dffa0' : chiaStage >= 1 ? '#45d6ff' : 'var(--ln,#3a3352)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `${chiaStage >= 3 ? 'rgba(255,210,63,.1)' : chiaStage >= 2 ? 'rgba(77,255,160,.08)' : 'rgba(0,0,0,.3)'}`,
                                  }}>
                                    <span style={{ fontSize: 22 }}>
                                      {chiaStage === 0 ? '🌰' : chiaStage === 1 ? '🌱' : chiaStage === 2 ? '🌿' : '🌳'}
                                    </span>
                                  </div>
                                  <div className="font-pixel" style={{ fontSize: 11, color: 'var(--mu,#9990ab)', marginTop: 5 }}>
                                    LVL {chiaLevel}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--ln,#3a3352)' }}>
                          <button
                            onClick={() => setProgressPage(Math.max(1, progressPage - 1))}
                            disabled={progressPage <= 1}
                            style={{
                              fontFamily: "'Press Start 2P', monospace",
                              fontSize: 9,
                              padding: '8px 12px',
                              border: '2px solid var(--ln,#3a3352)',
                              borderRadius: 5,
                              background: progressPage <= 1 ? 'transparent' : 'rgba(255,255,255,.05)',
                              color: progressPage <= 1 ? 'var(--ln,#3a3352)' : 'var(--tx,#e4e0ee)',
                              cursor: progressPage <= 1 ? 'default' : 'pointer',
                            }}
                          >
                            ◄
                          </button>
                          <span style={{ fontSize: 14, color: 'var(--mu,#9990ab)' }}>
                            Page <span style={{ color: 'var(--tx,#e4e0ee)' }}>{progressPage}</span> of {totalPages}
                          </span>
                          <button
                            onClick={() => setProgressPage(Math.min(totalPages, progressPage + 1))}
                            disabled={progressPage >= totalPages}
                            style={{
                              fontFamily: "'Press Start 2P', monospace",
                              fontSize: 9,
                              padding: '8px 12px',
                              border: '2px solid var(--ln,#3a3352)',
                              borderRadius: 5,
                              background: progressPage >= totalPages ? 'transparent' : 'rgba(255,255,255,.05)',
                              color: progressPage >= totalPages ? 'var(--ln,#3a3352)' : 'var(--tx,#e4e0ee)',
                              cursor: progressPage >= totalPages ? 'default' : 'pointer',
                            }}
                          >
                            ►
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </>
          )}

          {/* ═══════════════ AI LABS ═══════════════ */}
          {section === 'ailabs' && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, justifyContent: 'space-between', margin: '0 2px 10px' }}>
                <div className="font-pixel" style={{ fontSize: 11, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>◱ EMBEDDED PLATFORMS</div>
                <div style={{ fontSize: 15, color: 'var(--mu,#9990ab)' }}>Students switch between these in the Lab sandbox</div>
              </div>
              <div style={{ border: '2px solid var(--ln,#3a3352)', borderRadius: 9, background: '#201a30', padding: '14px 15px' }}>
                <div style={{ fontSize: 14, color: 'var(--mu,#9990ab)', lineHeight: 1.4, marginBottom: 12, maxWidth: 720 }}>
                  Eden.art ships as the default sandbox. Add any AI tool as an extra tab students can switch to. Choose how each one opens: <span style={{ color: 'var(--tx,#e4e0ee)', fontWeight: 600 }}>Launch</span> opens it in a new tab (works everywhere, needed for sign-in tools like Eden, Claude & Google AI Studio) — <span style={{ color: 'var(--tx,#e4e0ee)', fontWeight: 600 }}>Embed</span> shows it inline (only for tools that allow framing, e.g. Figma view links, YouTube, videos, docs).
                </div>

                {isLoadingPlatforms ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--mu,#9990ab)', fontSize: 14 }}>
                    Loading platforms...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {platformsData.map((platform) => (
                      <div
                        key={platform.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 11,
                          border: '2px solid var(--ln,#3a3352)',
                          borderRadius: 8,
                          background: 'rgba(0,0,0,.22)',
                          padding: '11px 13px',
                        }}
                      >
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--p,#c98bad)', flex: 'none' }}></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, color: 'var(--tx,#e4e0ee)', lineHeight: 1.25 }}>{platform.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--mu,#9990ab)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(() => { try { return new URL(platform.url).hostname } catch { return platform.url } })()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 'none' }}>
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-pixel"
                            style={{ fontSize: 7, color: '#0e1512', background: '#4dffa0', border: 'none', borderRadius: 5, padding: '8px 10px', textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            LAUNCH
                          </a>
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-pixel"
                            style={{ fontSize: 7, color: 'var(--tx,#e4e0ee)', background: 'transparent', border: '1px solid var(--ln,#3a3352)', borderRadius: 5, padding: '8px 10px', textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            EMBED
                          </a>
                          {!platform.is_default && (
                            <button
                              onClick={async () => {
                                try {
                                  await deletePlatform(platform.id)
                                  setPlatformsData(platformsData.filter(p => p.id !== platform.id))
                                  setToast('Platform removed')
                                } catch (e) {
                                  console.error(e)
                                  setToast('Failed to remove platform')
                                }
                              }}
                              className="font-pixel"
                              style={{ fontSize: 7, color: '#e06a5a', background: 'none', border: '2px solid #7a3a34', borderRadius: 5, padding: '8px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {platformsData.length === 0 && (
                      <div style={{ border: '2px dashed var(--ln,#3a3352)', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 15, color: 'var(--mu,#9990ab)' }}>
                        No platforms configured yet. Add Eden.art or another tool below.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ borderTop: '1px dashed var(--ln,#3a3352)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div className="font-pixel" style={{ fontSize: 7, color: 'var(--s,#45d6ff)' }}>＋ ADD A PLATFORM</div>
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Platform name — e.g. Google AI Studio…"
                    style={{ width: '100%', background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln,#3a3352)', borderRadius: 5, color: 'var(--tx,#e4e0ee)', fontSize: 16, padding: '10px 11px' }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newPlatformUrl}
                      onChange={(e) => setNewPlatformUrl(e.target.value)}
                      placeholder="URL — e.g. https://aistudio.google.com/"
                      style={{ flex: 1, minWidth: 220, background: 'rgba(0,0,0,.4)', border: '2px solid var(--ln,#3a3352)', borderRadius: 5, color: 'var(--tx,#e4e0ee)', fontSize: 15, padding: '9px 11px' }}
                    />
                    <button
                      onClick={async () => {
                        if (!newPlatformName || !newPlatformUrl) {
                          setToast('Please enter both platform name and URL')
                          return
                        }
                        let url = newPlatformUrl.trim()
                        if (!/^https?:\/\//i.test(url)) {
                          url = 'https://' + url
                        }
                        try {
                          const newPlatform = await createPlatform(cohortId, { name: newPlatformName, url })
                          setPlatformsData([...platformsData, newPlatform])
                          setNewPlatformName('')
                          setNewPlatformUrl('')
                          setToast('Platform added')
                        } catch (e) {
                          console.error(e)
                          setToast('Failed to add platform')
                        }
                      }}
                      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: '#0e1512', background: '#4dffa0', border: 'none', borderRadius: 5, padding: '12px 18px', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: 1 }}
                    >
                      ＋ ADD
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--mu,#9990ab)', lineHeight: 1.4 }}>
                    Tip: most AI tools (Eden, Claude, ChatGPT, Google AI Studio) require sign-in and block framing — keep those on <span style={{ color: 'var(--tx,#e4e0ee)' }}>Launch</span>. Use <span style={{ color: 'var(--tx,#e4e0ee)' }}>Embed</span> only for view-only links (Figma prototype/embed URLs, YouTube, published docs).
                  </div>
                </div>
              </div>
            </>
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
              position: 'relative',
            }}
          >
            {/* CRT Scanlines effect */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0px, rgba(0,0,0,.12) 1px, transparent 2px, transparent 3px)', mixBlendMode: 'multiply' }} />
            {/* Decorative top bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'rgba(0,0,0,.3)',
              borderBottom: '2px solid var(--ln,#3d2668)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e07a6a' }}></span>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e6c25a' }}></span>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7fb06a' }}></span>
                </div>
                <span className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>
                  SESSION EDITOR · STEWARD CONSOLE
                </span>
              </div>
            </div>

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
                className="font-pixel admin-entry-type-select"
                value={selEntry.entry_type || 'text'}
                onChange={e => handleEntryFieldBlur(selEntry.id, 'entry_type', e.target.value)}
                style={{ 
                  fontSize: '9px', 
                  height: '24px',
                  lineHeight: '24px',
                  color: '#141019', 
                  background: 'var(--gold,#ffd23f)', 
                  borderRadius: 20, 
                  padding: '0 12px', 
                  flex: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                }}
              >
                <option value="text" style={{ fontSize: '9px' }}>TEXT</option>
                <option value="featured" style={{ fontSize: '9px' }}>FEATURED</option>
                <option value="deliverable" style={{ fontSize: '9px' }}>DELIVERABLE</option>
              </select>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-pixel" style={{ fontSize: 9, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>
                  SESSION {selEntry.num}
                </div>
                <div className="font-pixel" style={{ fontSize: 'clamp(10px,1.5vw,12px)', color: 'var(--tx,#efe6ff)', marginTop: 4, lineHeight: 1.4 }}>
                  {selEntry.title}
                </div>
              </div>
              <span className="font-pixel" style={{ fontSize: 8, color: isSaving ? 'var(--gold,#c9a85f)' : 'var(--ok,#74f0a0)', border: `1px solid ${isSaving ? 'var(--gold,#c9a85f)' : 'var(--ok,#74f0a0)'}`, borderRadius: 20, padding: '4px 8px', flex: 'none' }}>
                {isSaving ? '○ SAVING…' : '● SAVES LIVE'}
              </span>
              <button
                onClick={() => setEditorOpen(false)}
                className="font-pixel"
                style={{ fontSize: 9, color: 'var(--tx,#efe6ff)', background: 'none', border: '2px solid var(--ln,#3d2668)', borderRadius: 5, padding: '7px 10px', cursor: 'pointer', flex: 'none' }}
              >✓ SAVE & CLOSE</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
              {/* LEFT: text content */}
              <div style={{ flex: '3 1 460px', minWidth: 300, padding: 'clamp(18px,2.4vw,28px)', overflow: 'auto' }}>
                <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>TOPIC TITLE</div>
                <input defaultValue={selEntry.title} onBlur={e => handleEntryFieldBlur(selEntry.id, 'title', e.target.value)} style={{ ...inputStyle, fontSize: 20, marginBottom: 16, padding: '12px 14px' }} />
                <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>SUBTITLE / SIDEBAR LABEL</div>
                <input defaultValue={selEntry.subtitle || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'subtitle', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 18, padding: '12px 14px' }} />
                
                {selEntry.entry_type === 'deliverable' ? (
                  (() => {
                    const bodyParts = (selEntry.body || '').split('<!--BLOCK-->')
                    const appliedBody = selEntry.applied || bodyParts[0] || ''
                    const labBody = selEntry.lab || bodyParts[1] || ''
                    const goalBody = selEntry.goal || bodyParts[2] || ''
                    return (
                      <>
                        <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>SUBMISSION PROMPT LABEL</div>
                        <input defaultValue={selEntry.submit_label || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'submit_label', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 16, padding: '12px 14px' }} placeholder="e.g. Paste your story asset link..." />
                        
                        {(() => {
                          const bodyParts = (selEntry.body || '').split('<!--BLOCK-->')
                          const blocks = bodyParts
                          return (
                            <AdditionalBlocksEditor
                              blocks={blocks}
                              onSave={newBlocks => handleEntryFieldBlur(selEntry.id, 'body', newBlocks.join('<!--BLOCK-->'))}
                              endRef={blocksEndRef}
                            />
                          )
                        })()}
                      </>
                    )
                  })()
                ) : selEntry.entry_type === 'dual' ? (
                  <>
                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>MODERN · TITLE</div>
                    <input defaultValue={selEntry.modern_title || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'modern_title', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 16, padding: '12px 14px' }} placeholder="e.g. The Cloned Voice" />

                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>MODERN · BODY</div>
                    <div style={{ marginBottom: 16 }}>
                      <RichEditor
                        value={selEntry.modern_body || ''}
                        onBlur={val => handleEntryFieldBlur(selEntry.id, 'modern_body', val)}
                        minHeight={150}
                        accent="var(--s,#45d6ff)"
                      />
                    </div>

                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>ANCIENT · TITLE</div>
                    <input defaultValue={selEntry.ancient_title || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'ancient_title', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 16, padding: '12px 14px' }} placeholder="e.g. The Songkeeper of the Dunes" />

                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>ANCIENT · BODY</div>
                    <div style={{ marginBottom: 16 }}>
                      <RichEditor
                        value={selEntry.ancient_body || ''}
                        onBlur={val => handleEntryFieldBlur(selEntry.id, 'ancient_body', val)}
                        minHeight={150}
                        accent="var(--gold,#ffd23f)"
                      />
                    </div>

                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>FRAMEWORK</div>
                    <input defaultValue={selEntry.framework || ''} onBlur={e => handleEntryFieldBlur(selEntry.id, 'framework', e.target.value)} style={{ ...inputStyle, fontSize: 18, marginBottom: 16, padding: '12px 14px' }} placeholder="e.g. The Philosophy of 'The Crack' - community as sanctuary." />
                  </>
                ) : selEntry.entry_type === 'featured' ? (
                  <>
                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>FEATURED CONTRIBUTOR PIECE</div>
                    <select
                      value={selEntry.contrib_id || ''}
                      onChange={e => handleEntryFieldBlur(selEntry.id, 'contrib_id', e.target.value === '' ? null : e.target.value)}
                      style={{ ...inputStyle, fontSize: 16, marginBottom: 16, padding: '12px 14px', background: 'rgba(0,0,0,0.6)' }}
                    >
                      <option value="">-- Select a piece --</option>
                      {(showcaseList || []).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.type === 'video' ? 'Video Lesson' : item.type === 'audio' ? 'Audio Guide' : item.type === 'article' ? 'Article' : item.type === 'aigen' ? 'AI Generation' : 'Resource'} - {item.title} · {item.author || 'Unknown'}
                        </option>
                      ))}
                    </select>

                    <div className="font-vt323" style={{ fontSize: 22, color: 'var(--mu,#a493c9)', marginBottom: 6 }}>WHY IT'S FEATURED · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text</span></div>
                    <div style={{ marginBottom: 16 }}>
                      <RichEditor
                        value={selEntry.note || ''}
                        onBlur={val => handleEntryFieldBlur(selEntry.id, 'note', val)}
                        minHeight={150}
                        accent="var(--s,#45d6ff)"
                      />
                    </div>
                    {(() => {
                      const parts = (selEntry.body || '').split('<!--BLOCK-->')
                      const mainBody = parts[0] || ''
                      const additionalBlocks = parts.slice(1)
                      return (
                        <AdditionalBlocksEditor
                          blocks={additionalBlocks}
                          onSave={newBlocks => handleEntryFieldBlur(selEntry.id, 'body', [mainBody, ...newBlocks].join('<!--BLOCK-->'))}
                          endRef={blocksEndRef}
                        />
                      )
                    })()}
                  </>
                ) : selEntry.entry_type === 'list' ? (
                  <>
                    <div style={{ fontSize: 19, color: 'var(--mu,#a493c9)', marginBottom: 12 }}>
                      LIST ITEMS
                    </div>
                    {(() => {
                      const items = selEntry.items || []
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div className="font-pixel" style={{ color: 'var(--pk,#ff5fd2)', fontSize: 10, paddingTop: 14 }}>◈</div>
                              <textarea
                                defaultValue={item}
                                onBlur={e => {
                                  const newItems = [...items]
                                  newItems[idx] = e.target.value
                                  handleEntryFieldBlur(selEntry.id, 'items', newItems)
                                }}
                                style={{
                                  ...inputStyle,
                                  fontSize: 16,
                                  padding: '12px 14px',
                                  minHeight: 60,
                                  resize: 'vertical',
                                  flex: 1,
                                  fontFamily: 'inherit'
                                }}
                              />
                              <button
                                onClick={() => {
                                  const newItems = [...items]
                                  newItems.splice(idx, 1)
                                  handleEntryFieldBlur(selEntry.id, 'items', newItems)
                                }}
                                className="font-pixel"
                                style={{
                                  fontSize: 12, cursor: 'pointer', color: 'var(--warn,#ff7a7a)', background: 'transparent',
                                  border: 'none', padding: '12px 4px', flex: 'none'
                                }}
                                title="Remove item"
                              >✕</button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newItems = [...items, '']
                              handleEntryFieldBlur(selEntry.id, 'items', newItems)
                            }}
                            className="font-pixel"
                            style={{
                              fontSize: 9, cursor: 'pointer', color: 'var(--pk,#ff5fd2)', background: 'transparent',
                              border: '2px dashed var(--pk,#ff5fd2)', borderRadius: 6, padding: '12px', marginTop: 4
                            }}
                          >＋ ADD LIST ITEM</button>
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <>
                    {selEntry.entry_type !== 'text' && (
                      <div style={{ fontSize: 19, color: 'var(--mu,#a493c9)', marginBottom: 8 }}>
                        CONTENT · <span style={{ color: 'var(--ok,#74f0a0)' }}>rich text — bold, italic, lists & links</span>
                      </div>
                    )}
                    {(() => {
                      const bodyParts = (selEntry.body || '').split('<!--BLOCK-->')
                      const isTextOnlyBlocks = selEntry.entry_type === 'text'
                      const mainBody = isTextOnlyBlocks ? '' : (bodyParts[0] || '')
                      const additionalBlocks = isTextOnlyBlocks ? bodyParts : bodyParts.slice(1)
                      
                      return (
                        <>
                          {!isTextOnlyBlocks && (
                            <RichEditor
                              value={mainBody}
                              onBlur={val => handleEntryFieldBlur(selEntry.id, 'body', [val, ...additionalBlocks].join('<!--BLOCK-->'))}
                              minHeight={200}
                              accent="var(--ok,#74f0a0)"
                            />
                          )}
                          
                          <AdditionalBlocksEditor
                            blocks={additionalBlocks}
                            onSave={newBlocks => {
                              const newBody = isTextOnlyBlocks ? newBlocks.join('<!--BLOCK-->') : [mainBody, ...newBlocks].join('<!--BLOCK-->')
                              handleEntryFieldBlur(selEntry.id, 'body', newBody)
                            }}
                            endRef={blocksEndRef}
                          />
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
                maxWidth: 420,
                borderLeft: '2px solid var(--ln,#3d2668)',
                background: 'rgba(0,0,0,.18)',
                padding: 'clamp(16px,2vw,24px)',
                overflow: 'auto',
              }}>
                <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', letterSpacing: 1, marginBottom: 10 }}>
                  ◈ PHOTOS · VIDEO · LINKS
                </div>
                <div style={{ fontSize: 16, color: 'var(--mu,#a493c9)', marginBottom: 12, lineHeight: 1.4 }}>
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
                    <div className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', padding: '8px 12px', animation: 'pulse 1.5s infinite' }}>
                      ⏳ {uploadingMediaKind ? `UPLOADING ${uploadingMediaKind.toUpperCase()}` : 'ADDING LINK'}...
                    </div>
                  ) : (
                    (['photo', 'video', 'audio', 'link'] as const).map(t => (
                      <button key={t} onClick={() => handleAddMedia(selEntry.id, t)} className="font-pixel" style={{
                        fontSize: 9,
                        fontWeight: 'bold',
                        padding: '8px 11px',
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                    <SortableList
                      items={entryMediaList}
                      onChange={async (newOrder) => {
                        setEntryMediaList(newOrder);
                        try {
                          await reorderEntryMedia(selEntry.id, newOrder.map((m, idx) => ({ id: m.id, sort_order: idx + 1 })));
                        } catch (err) {
                          console.error('Failed to reorder media', err);
                        }
                      }}
                      renderItem={(m: any, isDragging: boolean, dragHandleProps: any) => (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: isDragging ? 'rgba(255,210,63,.06)' : 'rgba(0,0,0,.3)', border: '1px solid var(--ln,#3d2668)', borderRadius: 8, padding: '10px 14px', overflow: 'hidden', boxShadow: isDragging ? '0 8px 20px -8px rgba(0,0,0,.6)' : 'none' }}>
                          <div
                            className="sortable-drag-handle"
                            title="Drag to reorder"
                            {...dragHandleProps}
                            style={{ 
                              cursor: 'grab', 
                              padding: '2px 0 0 0', 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              color: 'var(--mu,#a493c9)',
                              opacity: 0.5,
                              marginTop: 4,
                              touchAction: 'none',
                            }}
                          >
                            <GripVertical size={14} />
                          </div>
                          <span className="font-pixel" style={{ fontSize: 8, color: 'var(--gold,#ffd23f)', flex: 'none', background: 'rgba(255,210,63,.1)', padding: '5px 7px', borderRadius: 4, marginTop: 4 }}>
                            {m.kind.toUpperCase()}
                          </span>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input
                            type="text"
                            defaultValue={m.label || ''}
                            onBlur={(e) => handleMediaCaptionChange(m.id, e.target.value)}
                            placeholder="Add a caption..."
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid var(--ln,#3d2668)',
                              borderRadius: 4,
                              color: 'var(--tx,#efe6ff)',
                              fontSize: 14,
                              padding: '6px 8px',
                              marginBottom: 8,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          
                          {m.kind === 'photo' && m.url ? (
                            <img src={m.url} alt={m.label || 'Attached photo'} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} />
                          ) : m.kind === 'video' && m.url ? (
                            (() => {
                              const url = m.url || '';
                              const isYT = url.includes('youtube.com') || url.includes('youtu.be');
                              const isVimeo = url.includes('vimeo.com');
                              if (isYT) {
                                let videoId = null;
                                if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                else videoId = new URLSearchParams(url.split('?')[1] || '').get('v');
                                return videoId ? (
                                  <iframe src={`https://www.youtube.com/embed/${videoId}`} style={{ width: '100%', height: 160, borderRadius: 6, border: 'none' }} allowFullScreen />
                                ) : <video src={url} controls style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6 }} />;
                              }
                              if (isVimeo) {
                                const vimeoId = url.split('/').pop();
                                return <iframe src={`https://player.vimeo.com/video/${vimeoId}`} style={{ width: '100%', height: 160, borderRadius: 6, border: 'none' }} allowFullScreen />;
                              }
                              return <video src={url} controls style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }} />;
                            })()
                          ) : m.kind === 'audio' && m.url ? (
                            <audio src={m.url} controls style={{ width: '100%', marginTop: 4 }} />
                          ) : m.url ? (
                            (() => {
                              const url = (m.url || '').toLowerCase();
                              const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i.test(url) || url.includes('unsplash.com') || url.includes('imgur.com');
                              const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
                              const isAudio = /\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(url);
                              
                              if (isImage) {
                                return <img src={m.url} alt={m.label || 'Link preview'} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} />;
                              }
                              if (isVideo) {
                                const ytMatch = m.url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+)/);
                                if (ytMatch) return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} style={{ width: '100%', height: 160, borderRadius: 6, border: 'none' }} allowFullScreen />;
                                const vimeoMatch = m.url.match(/vimeo\.com\/(\d+)/);
                                if (vimeoMatch) return <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} style={{ width: '100%', height: 160, borderRadius: 6, border: 'none' }} allowFullScreen />;
                                return <video src={m.url} controls style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6 }} />;
                              }
                              if (isAudio) {
                                return <audio src={m.url} controls style={{ width: '100%', marginTop: 4 }} />;
                              }
                              return (
                                <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--s,#45d6ff)', wordBreak: 'break-all', textDecoration: 'underline' }}>{m.url}</a>
                              );
                            })()
                          ) : null}
                        </div>
                        
                        <button onClick={() => handleRemoveMedia(m.id, selEntry.id)} style={{ fontSize: 14, color: 'var(--warn,#ff7a7a)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flex: 'none', marginTop: 2 }} title="Remove">✕</button>
                      </div>
                    )}
                    />
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

      {/* Link Input Dialog */}
      {linkInputDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,.75)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => { setLinkInputDialog(null); setLinkInputValue('') }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#201a30',
              border: '3px solid var(--gold,#ffd23f)',
              borderRadius: 12,
              maxWidth: 480,
              width: '90%',
              boxShadow: '0 0 30px rgba(255,210,63,.3)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* CRT Scanlines effect */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.12) 0px, rgba(0,0,0,.12) 1px, transparent 2px, transparent 3px)', mixBlendMode: 'multiply' }} />
            {/* Decorative top bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              background: 'rgba(0,0,0,.3)',
              borderBottom: '2px solid var(--ln,#3d2668)',
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e07a6a' }}></span>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e6c25a' }}></span>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#7fb06a' }}></span>
              </div>
              <span className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#a493c9)', letterSpacing: 1 }}>
                MEDIA · ADD URL
              </span>
            </div>

            <div style={{ padding: '24px 28px' }}>
            <div
              className="font-pixel"
              style={{
                fontSize: 12,
                color: 'var(--gold,#ffd23f)',
                marginBottom: 18,
                textAlign: 'center',
              }}
            >
              🔗 ADD LINK
            </div>
            
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 14, color: 'var(--mu,#a493c9)', marginBottom: 8, letterSpacing: '.1em' }}>
                ENTER URL
              </label>
              <input
                type="url"
                value={linkInputValue}
                onChange={(e) => setLinkInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && linkInputValue.trim()) handleLinkInputSubmit() }}
                placeholder="https://..."
                autoFocus
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0,0,0,.4)',
                  border: '2px solid var(--ln,#3d2668)',
                  borderRadius: 6,
                  padding: '14px 16px',
                  fontSize: 16,
                  color: 'var(--tx,#efe6ff)',
                  fontFamily: "'Exo', sans-serif",
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: 13, color: 'var(--mu,#a493c9)', marginTop: 8, opacity: 0.7 }}>
                Paste an image URL, YouTube link, or any web URL
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { setLinkInputDialog(null); setLinkInputValue('') }}
                className="font-pixel"
                style={{
                  fontSize: 10,
                  padding: '12px 24px',
                  border: '2px solid var(--mu,#9990ab)',
                  borderRadius: 8,
                  background: 'rgba(153,144,171,.15)',
                  color: 'var(--mu,#9990ab)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleLinkInputSubmit}
                disabled={!linkInputValue.trim()}
                className="font-pixel"
                style={{
                  fontSize: 10,
                  padding: '12px 24px',
                  border: '2px solid var(--gold,#ffd23f)',
                  borderRadius: 8,
                  background: linkInputValue.trim() ? 'rgba(255,210,63,.2)' : 'rgba(255,210,63,.05)',
                  color: linkInputValue.trim() ? 'var(--gold,#ffd23f)' : 'rgba(255,210,63,.4)',
                  cursor: linkInputValue.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                ADD LINK
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <RetroToast
        message={toast}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
