'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  createAnnouncement, 
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  updateProjectBulletin, 
  getSystemBulletins,
  getBulletinUpdates,
  getBulletinEvents,
  createBulletinUpdate,
  deleteBulletinUpdate,
  bulkDeleteBulletinUpdates,
  createBulletinEvent,
  deleteBulletinEvent,
  bulkDeleteBulletinEvents,
  updateBulletinUpdate,
  updateBulletinEvent,
  updateAboutPage,
  updateDemoVideoUrl
} from '@/app/actions/bulletins';
import { Pin, Globe, Trash2, Pencil, Bold, Italic, Link as LinkIcon, Image, X, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/utils/supabase/client';

async function uploadFileWithPresignedUrl(file: File, bucketName: string): Promise<string> {
  console.log(`[Upload] Starting presigned upload for ${file.name} to bucket ${bucketName}`);
  const res = await fetch('/api/admin/upload-media/presigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, bucketName })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[Upload] Failed to get presigned URL:', errorData);
    throw new Error(errorData.error || 'Failed to get upload URL');
  }
  
  const { token, filePath, publicUrl } = await res.json();
  console.log(`[Upload] Got presigned URL for ${filePath}, starting direct storage upload...`);
  
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .uploadToSignedUrl(filePath, token, file);
    
  if (uploadError) {
    console.error('[Upload] Supabase direct upload failed:', uploadError);
    throw new Error(uploadError.message || 'Upload to storage failed');
  }
  
  console.log(`[Upload] Success! Public URL:`, publicUrl);
  return publicUrl;
}

// Mini Rich Text Editor for announcements
function AnnouncementEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);

  // Handle clicks on images in editor
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && editorRef.current?.contains(target)) {
        e.preventDefault();
        setSelectedImg(target as HTMLImageElement);
      } else if (!target.closest('.img-delete-btn')) {
        setSelectedImg(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const deleteSelectedImage = () => {
    if (selectedImg && editorRef.current?.contains(selectedImg)) {
      selectedImg.remove();
      setSelectedImg(null);
      emit();
    }
  };

  useEffect(() => {
    if (editorRef.current && value && !isInitialized.current) {
      editorRef.current.innerHTML = value;
      isInitialized.current = true;
    }
  }, [value]);

  // When value is cleared externally (after posting), reset editor
  useEffect(() => {
    if (editorRef.current && value === '' && isInitialized.current) {
      editorRef.current.innerHTML = '';
      isInitialized.current = false;
    }
  }, [value]);

  const emit = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const cmd = (c: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(c, false, val);
    emit();
  };

  const handleLinkClick = () => {
    saveSelection();
    setLinkUrl('https://');
    setShowLinkInput(true);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    document.execCommand('createLink', false, linkUrl.trim());
    emit();
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleMediaUrlClick = () => {
    saveSelection();
    setMediaUrl('');
    setShowMediaInput(true);
  };

  const insertMediaFromUrl = () => {
    if (!mediaUrl.trim()) return;
    const url = mediaUrl.trim();
    const urlLower = url.toLowerCase();
    
    let html = '';
    
    // Detect image URLs
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$|\/)/i.test(urlLower) || urlLower.includes('placehold') || urlLower.includes('wikimedia')) {
      html = `<img src="${url}" alt="media" style="max-width:100%;border-radius:8px;margin:8px 0;" />`;
    }
    // Detect YouTube
    else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      else if (url.includes('youtube.com/watch')) videoId = new URLSearchParams(url.split('?')[1] || '').get('v') || '';
      if (videoId) {
        html = `<iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;margin:8px 0;" allowfullscreen></iframe>`;
      } else {
        html = `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
      }
    }
    // Detect Vimeo
    else if (urlLower.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop()?.split('?')[0] || '';
      html = `<iframe src="https://player.vimeo.com/video/${vimeoId}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px;margin:8px 0;" allowfullscreen></iframe>`;
    }
    // Detect direct video files
    else if (/\.(mp4|webm|mov)(\?|#|$)/i.test(urlLower)) {
      html = `<video src="${url}" controls preload="metadata" style="width:100%;border-radius:8px;margin:8px 0;"></video>`;
    }
    // Detect audio files
    else if (/\.(mp3|wav|ogg|m4a|flac|aac)(\?|#|$)/i.test(urlLower) || urlLower.includes('soundcloud.com')) {
      html = `<audio src="${url}" controls style="width:100%;margin:8px 0;"></audio>`;
    }
    // Default: insert as a hyperlink
    else {
      html = `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
    }
    
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    emit();
    setShowMediaInput(false);
    setMediaUrl('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok && data.url) {
        restoreSelection();
        editorRef.current?.focus();
        document.execCommand('insertHTML', false, `<img src="${data.url}" alt="image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
        emit();
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  };

  const btnClass = "p-1.5 rounded border border-[#785a32]/15 hover:bg-[#f6e5c3] transition-colors text-[#5c4f3c] flex items-center justify-center";

  return (
    <div className="my-[7px] mb-[18px] rounded-[11px] border border-[#785a32]/20 overflow-hidden bg-[#fdfaf0] relative">
      <div className="flex gap-1 p-2 border-b border-[#785a32]/10 bg-[#fef8ec] items-center">
        <button type="button" className={btnClass} title="Bold" onMouseDown={e => { e.preventDefault(); cmd('bold'); }}><Bold size={14} /></button>
        <button type="button" className={btnClass} title="Italic" onMouseDown={e => { e.preventDefault(); cmd('italic'); }}><Italic size={14} /></button>
        <button type="button" className={btnClass} title="Add link" onMouseDown={e => { e.preventDefault(); handleLinkClick(); }}><LinkIcon size={14} /></button>
        <label 
          className={`${btnClass} cursor-pointer ${isUploading ? 'opacity-50' : ''}`} 
          title="Upload image"
          onMouseDown={() => saveSelection()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          {isUploading ? <span className="animate-spin text-xs">⏳</span> : <Image size={14} />}
        </label>
        <button type="button" className={btnClass} title="Add media URL (image/video/audio)" onMouseDown={e => { e.preventDefault(); handleMediaUrlClick(); }}>
          <span className="text-[11px] font-bold">URL</span>
        </button>
        {isUploading && <span className="text-[11px] text-[#8a7c66] ml-1">Uploading...</span>}
      </div>

      {/* Link input inline bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 border-b border-[#785a32]/10 bg-[#f6f0e0]">
          <LinkIcon size={13} className="text-[#5c4f3c] flex-none" />
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } if (e.key === 'Escape') setShowLinkInput(false); }}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 p-1.5 rounded border border-[#785a32]/20 bg-white text-[13px] outline-none focus:border-[#2c8a4a]"
          />
          <button type="button" onClick={insertLink} className="px-3 py-1.5 rounded bg-[#2c8a4a] text-white text-[11px] font-bold hover:bg-[#247840]">Add</button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="px-2 py-1.5 rounded border border-[#785a32]/20 text-[11px] text-[#5c4f3c] hover:bg-[#f6e5c3]">Cancel</button>
        </div>
      )}

      {/* Media URL input bar */}
      {showMediaInput && (
        <div className="flex items-center gap-2 p-2 border-b border-[#2c8a4a]/20 bg-[#f0f8f2]">
          <span className="text-[13px] flex-none">🎬</span>
          <input
            type="url"
            value={mediaUrl}
            onChange={e => setMediaUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertMediaFromUrl(); } if (e.key === 'Escape') setShowMediaInput(false); }}
            placeholder="Paste image, video, or audio URL..."
            autoFocus
            className="flex-1 p-1.5 rounded border border-[#2c8a4a]/20 bg-white text-[13px] outline-none focus:border-[#2c8a4a]"
          />
          <button type="button" onClick={insertMediaFromUrl} className="px-3 py-1.5 rounded bg-[#2c8a4a] text-white text-[11px] font-bold hover:bg-[#247840]">Embed</button>
          <button type="button" onClick={() => setShowMediaInput(false)} className="px-2 py-1.5 rounded border border-[#785a32]/20 text-[11px] text-[#5c4f3c] hover:bg-[#f6e5c3]">Cancel</button>
        </div>
      )}

      {/* Image selected - show delete bar */}
      {selectedImg && (
        <div className="flex items-center gap-2 p-2 border-b border-red-200 bg-red-50">
          <span className="text-[11px] text-red-600 font-medium flex-1">Image selected</span>
          <button type="button" onClick={deleteSelectedImage} className="img-delete-btn px-3 py-1.5 rounded bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 flex items-center gap-1">
            🗑 Remove image
          </button>
          <button type="button" onClick={() => setSelectedImg(null)} className="px-2 py-1.5 rounded border border-[#785a32]/20 text-[11px] text-[#5c4f3c] hover:bg-[#f6e5c3]">Cancel</button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        data-placeholder={placeholder || 'Write the announcement members will read…'}
        className="p-[13px_15px] text-[14px] min-h-[96px] leading-relaxed outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#9c8d76] [&:empty]:before:pointer-events-none [&_a]:text-[#2c8a4a] [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2 [&_img]:cursor-pointer [&_img]:hover:ring-2 [&_img]:hover:ring-red-300 [&_video]:rounded-lg [&_video]:max-w-full [&_video]:my-2 [&_audio]:w-full [&_audio]:my-2 [&_iframe]:rounded-lg [&_iframe]:max-w-full [&_iframe]:my-2"
      />
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  // Announcements State
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [phoneRinging, setPhoneRinging] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annToDelete, setAnnToDelete] = useState<string | null>(null);
  const [isDeletingAnn, setIsDeletingAnn] = useState(false);

  const [bulletinText, setBulletinText] = useState('');
  const [isSavingBulletin, setIsSavingBulletin] = useState(false);

  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [isSavingDemoVideo, setIsSavingDemoVideo] = useState(false);
  const [isUploadingDemoVideo, setIsUploadingDemoVideo] = useState(false);

  // Program Documents State
  const [programDocuments, setProgramDocuments] = useState<any[]>([]);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDemoVideoModal, setShowDemoVideoModal] = useState(false);
  const [docLabel, setDocLabel] = useState('');
  const [docPdfUrl, setDocPdfUrl] = useState('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Updates State
  const [updates, setUpdates] = useState<any[]>([]);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [upTag, setUpTag] = useState('');
  const [upTitle, setUpTitle] = useState('');
  const [upBody, setUpBody] = useState('');
  const [upDetail, setUpDetail] = useState('');
  const [upCta, setUpCta] = useState('');
  const [upLink, setUpLink] = useState('');
  const [upImage, setUpImage] = useState('');
  const [isSavingUp, setIsSavingUp] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<string | null>(null);
  const [isDeletingUp, setIsDeletingUp] = useState(false);

  // Events State
  const [events, setEvents] = useState<any[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evBadge, setEvBadge] = useState('');
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evTime, setEvTime] = useState('');
  const [evLoc, setEvLoc] = useState('');
  const [evImage, setEvImage] = useState('');
  const [isSavingEv, setIsSavingEv] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isDeletingEv, setIsDeletingEv] = useState(false);

  // About Page State
  const [aboutText, setAboutText] = useState('');
  const [contactText, setContactText] = useState('');
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  // Bulk Delete State — Updates
  const [updatesBulkMode, setUpdatesBulkMode] = useState(false);
  const [selectedUpdateIds, setSelectedUpdateIds] = useState<Set<string>>(new Set());
  const [bulkDeleteUpdatesConfirm, setBulkDeleteUpdatesConfirm] = useState(false);
  const [isBulkDeletingUpdates, setIsBulkDeletingUpdates] = useState(false);

  // Bulk Delete State — Events
  const [eventsBulkMode, setEventsBulkMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [bulkDeleteEventsConfirm, setBulkDeleteEventsConfirm] = useState(false);
  const [isBulkDeletingEvents, setIsBulkDeletingEvents] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const anns = await getAnnouncements();
      setAnnouncements(anns);
      
      const sys = await getSystemBulletins();
      if (sys) {
        setBulletinText(sys.project_bulletin_text || '');
        setAboutText(sys.about_content || '');
        setContactText(sys.contact_details || '');
        setDemoVideoUrl(sys.demo_video_url || '');
      }

      const [ups, evs] = await Promise.all([
        getBulletinUpdates(),
        getBulletinEvents()
      ]);
      setUpdates(ups);
      setEvents(evs);

      try {
        const docsRes = await fetch('/api/admin/program-documents');
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setProgramDocuments(docsData.documents || []);
        }
      } catch (e) {
        console.error('Failed to load program documents', e);
      }

    } catch (error) {
      console.error("Failed to load data", error);
    }
  }

  function handleEditAnnouncement(a: any) {
    setEditingAnnId(a.id);
    setAnnTitle(a.title);
    setAnnBody(a.body);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEditAnn() {
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnBody('');
  }

  function handleDeleteAnnouncement(id: string) {
    setAnnToDelete(id);
  }

  async function confirmDeleteAnnouncement() {
    if (!annToDelete) return;
    setIsDeletingAnn(true);
    try {
      await deleteAnnouncement(annToDelete);
      setAnnouncements(prev => prev.filter(a => a.id !== annToDelete));
      if (editingAnnId === annToDelete) handleCancelEditAnn();
      toast.success("Announcement deleted");
    } catch (error: any) {
      toast.error("Failed to delete announcement.");
    } finally {
      setIsDeletingAnn(false);
      setAnnToDelete(null);
    }
  }

  async function handlePostAnnouncement() {
    const strippedBody = annBody.replace(/<[^>]*>/g, '').trim();
    if (!annTitle.trim() || !strippedBody) {
      toast.error("Please enter a title and message.");
      return;
    }
    
    setIsPosting(true);
    try {
      if (editingAnnId) {
        await updateAnnouncement(editingAnnId, annTitle, annBody);
        toast.success("Announcement updated!");
        handleCancelEditAnn();
      } else {
        await createAnnouncement(annTitle, annBody);
        setAnnTitle('');
        setAnnBody('');
        setPhoneRinging(true);
        setTimeout(() => setPhoneRinging(false), 5000);
        toast.success("Announcement posted successfully!");
      }
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to post announcement.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleSaveBulletin() {
    setIsSavingBulletin(true);
    try {
      await updateProjectBulletin(bulletinText);
      setPhoneRinging(true);
      setTimeout(() => setPhoneRinging(false), 5000);
      toast.success("Project bulletin updated!");
    } catch (error: any) {
      toast.error("Failed to update bulletin.");
    } finally {
      setIsSavingBulletin(false);
    }
  }

  async function handleSaveDemoVideoUrl() {
    setIsSavingDemoVideo(true);
    try {
      await updateDemoVideoUrl(demoVideoUrl);
      toast.success("Demo video updated!");
    } catch (error: any) {
      toast.error("Failed to update demo video.");
    } finally {
      setIsSavingDemoVideo(false);
    }
  }

  async function handleDeleteDemoVideo() {
    if (!confirm('Are you sure you want to remove the demo video?')) return;
    setIsSavingDemoVideo(true);
    try {
      await updateDemoVideoUrl('');
      setDemoVideoUrl('');
      toast.success("Demo video removed!");
    } catch (error: any) {
      toast.error("Failed to remove demo video.");
    } finally {
      setIsSavingDemoVideo(false);
    }
  }

  async function handleUploadDemoVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }
    
    setIsUploadingDemoVideo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'demo-videos'); // custom bucket for demo videos
    
    try {
      // Use presigned URLs for large files to bypass Next.js 4.5MB payload limit
      const publicUrl = await uploadFileWithPresignedUrl(file, 'demo-videos');
      setDemoVideoUrl(publicUrl);
      toast.success('Video uploaded successfully! Make sure to save.');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading video');
    } finally {
      setIsUploadingDemoVideo(false);
      if (e.target) e.target.value = ''; // reset input
    }
  }

  // Program Documents Handlers
  function handleEditDoc(doc: any) {
    setEditingDocId(doc.id);
    setDocLabel(doc.label);
    setDocPdfUrl(doc.pdf_url);
  }

  function handleCancelEditDoc() {
    setEditingDocId(null);
    setDocLabel('');
    setDocPdfUrl('');
  }

  async function handleSaveDoc() {
    if (!docLabel.trim() || !docPdfUrl.trim()) {
      toast.error('Label and PDF URL are required.');
      return;
    }
    setIsSavingDoc(true);
    try {
      if (editingDocId) {
        const res = await fetch('/api/admin/program-documents', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDocId, label: docLabel, pdf_url: docPdfUrl })
        });
        if (!res.ok) throw new Error('Failed to update document');
        setProgramDocuments(prev => prev.map(d => d.id === editingDocId ? { ...d, label: docLabel, pdf_url: docPdfUrl } : d));
        toast.success('Document updated');
      } else {
        const res = await fetch('/api/admin/program-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: docLabel, pdf_url: docPdfUrl, sort_order: programDocuments.length })
        });
        if (!res.ok) throw new Error('Failed to add document');
        const data = await res.json();
        setProgramDocuments([...programDocuments, data.document]);
        toast.success('Document added');
      }
      handleCancelEditDoc();
    } catch (error: any) {
      toast.error(error.message || 'Error saving document');
    } finally {
      setIsSavingDoc(false);
    }
  }

  async function handleDeleteDoc(id: number) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/admin/program-documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setProgramDocuments(prev => prev.filter(d => d.id !== id));
      if (editingDocId === id) handleCancelEditDoc();
      toast.success('Document deleted');
    } catch (error: any) {
      toast.error(error.message || 'Error deleting document');
    }
  }

  async function handleToggleDocActive(doc: any) {
    try {
      const res = await fetch('/api/admin/program-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, is_active: !doc.is_active })
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      setProgramDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, is_active: !doc.is_active } : d));
      toast.success(`Document ${!doc.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message || 'Error toggling status');
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    
    setIsUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const publicUrl = await uploadFileWithPresignedUrl(file, 'content-uploads');
      setDocPdfUrl(publicUrl);
      if (!docLabel) {
        // use filename as default label
        setDocLabel(file.name.replace('.pdf', ''));
      }
      toast.success('PDF uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading PDF');
    } finally {
      setIsUploadingDoc(false);
      if (e.target) e.target.value = ''; // reset input
    }
  }

  async function handleSaveAbout() {
    setIsSavingAbout(true);
    try {
      await updateAboutPage(aboutText, contactText);
      toast.success("About page updated!");
    } catch (error: any) {
      toast.error("Failed to update about page.");
    } finally {
      setIsSavingAbout(false);
    }
  }

  function handleEditUpdate(u: any) {
    setEditingUpdateId(u.id);
    setUpTag(u.tag);
    setUpTitle(u.title);
    setUpBody(u.body);
    setUpDetail(u.detail || '');
    setUpCta(u.cta_label || '');
    setUpLink(u.link_url || '');
    setUpImage(u.image_url || '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function handleCancelEditUpdate() {
    setEditingUpdateId(null);
    setUpTag(''); setUpTitle(''); setUpBody(''); setUpDetail(''); setUpCta(''); setUpLink(''); setUpImage('');
  }

  async function handleSaveUpdate() {
    if (!upTag.trim() || !upTitle.trim() || !upBody.trim()) {
      toast.error("Tag, Title, and Body are required.");
      return;
    }
    setIsSavingUp(true);
    try {
      const data = { tag: upTag, title: upTitle, body: upBody, detail: upDetail, cta_label: upCta, link_url: upLink, image_url: upImage || null };
      if (editingUpdateId) {
        await updateBulletinUpdate(editingUpdateId, data);
        toast.success("Update saved!");
      } else {
        await createBulletinUpdate(data);
        toast.success("Update published!");
      }
      handleCancelEditUpdate();
      loadData();
    } catch (error: any) {
      toast.error("Failed to save update.");
    } finally {
      setIsSavingUp(false);
    }
  }

  function handleDeleteUpdate(id: string) {
    setUpdateToDelete(id);
  }

  async function confirmDeleteUpdate() {
    if (!updateToDelete) return;
    setIsDeletingUp(true);
    try {
      await deleteBulletinUpdate(updateToDelete);
      setUpdates(prev => prev.filter(u => u.id !== updateToDelete));
      if (editingUpdateId === updateToDelete) handleCancelEditUpdate();
      toast.success("Update deleted");
    } catch (error: any) {
      toast.error("Failed to delete update.");
    } finally {
      setIsDeletingUp(false);
      setUpdateToDelete(null);
    }
  }

  function handleEditEvent(e: any) {
    setEditingEventId(e.id);
    setEvBadge(e.badge);
    setEvTitle(e.title);
    setEvDate(e.event_date);
    setEvTime(e.event_time);
    setEvLoc(e.location);
    setEvImage(e.image_url || '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function handleCancelEditEvent() {
    setEditingEventId(null);
    setEvBadge(''); setEvTitle(''); setEvDate(''); setEvTime(''); setEvLoc(''); setEvImage('');
  }

  async function handleSaveEvent() {
    if (!evBadge.trim() || !evTitle.trim() || !evDate.trim() || !evTime.trim() || !evLoc.trim()) {
      toast.error("All event fields are required.");
      return;
    }
    setIsSavingEv(true);
    try {
      const data = { badge: evBadge, title: evTitle, event_date: evDate, event_time: evTime, location: evLoc, image_url: evImage || null };
      if (editingEventId) {
        await updateBulletinEvent(editingEventId, data);
        toast.success("Event saved!");
      } else {
        await createBulletinEvent(data);
        toast.success("Event published!");
      }
      handleCancelEditEvent();
      loadData();
    } catch (error: any) {
      toast.error("Failed to save event.");
    } finally {
      setIsSavingEv(false);
    }
  }

  function handleDeleteEvent(id: string) {
    setEventToDelete(id);
  }

  async function confirmDeleteEvent() {
    if (!eventToDelete) return;
    setIsDeletingEv(true);
    try {
      await deleteBulletinEvent(eventToDelete);
      setEvents(prev => prev.filter(e => e.id !== eventToDelete));
      if (editingEventId === eventToDelete) handleCancelEditEvent();
      toast.success("Event deleted");
    } catch (error: any) {
      toast.error("Failed to delete event.");
    } finally {
      setIsDeletingEv(false);
      setEventToDelete(null);
    }
  }

  // Bulk delete handlers — Updates
  function toggleUpdateSelection(id: string) {
    setSelectedUpdateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllUpdates() {
    if (selectedUpdateIds.size === updates.length) {
      setSelectedUpdateIds(new Set());
    } else {
      setSelectedUpdateIds(new Set(updates.map(u => u.id)));
    }
  }

  function exitUpdatesBulkMode() {
    setUpdatesBulkMode(false);
    setSelectedUpdateIds(new Set());
  }

  async function confirmBulkDeleteUpdates() {
    if (!selectedUpdateIds.size) return;
    setIsBulkDeletingUpdates(true);
    try {
      await bulkDeleteBulletinUpdates(Array.from(selectedUpdateIds));
      setUpdates(prev => prev.filter(u => !selectedUpdateIds.has(u.id)));
      toast.success(`${selectedUpdateIds.size} update${selectedUpdateIds.size > 1 ? 's' : ''} deleted`);
      exitUpdatesBulkMode();
    } catch (error: any) {
      toast.error('Failed to delete updates.');
    } finally {
      setIsBulkDeletingUpdates(false);
      setBulkDeleteUpdatesConfirm(false);
    }
  }

  // Bulk delete handlers — Events
  function toggleEventSelection(id: string) {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllEvents() {
    if (selectedEventIds.size === events.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(events.map(e => e.id)));
    }
  }

  function exitEventsBulkMode() {
    setEventsBulkMode(false);
    setSelectedEventIds(new Set());
  }

  async function confirmBulkDeleteEvents() {
    if (!selectedEventIds.size) return;
    setIsBulkDeletingEvents(true);
    try {
      await bulkDeleteBulletinEvents(Array.from(selectedEventIds));
      setEvents(prev => prev.filter(e => !selectedEventIds.has(e.id)));
      toast.success(`${selectedEventIds.size} event${selectedEventIds.size > 1 ? 's' : ''} deleted`);
      exitEventsBulkMode();
    } catch (error: any) {
      toast.error('Failed to delete events.');
    } finally {
      setIsBulkDeletingEvents(false);
      setBulkDeleteEventsConfirm(false);
    }
  }

  const phoneStatus = phoneRinging ? '☎ RINGING — TAP TO READ' : 'IDLE · NO NEW ANNOUNCEMENT';
  const phoneLabelClass = phoneRinging ? 'text-[#f2c14e]' : 'text-white/40';

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full font-exo text-[#241c12] animate-in fade-in duration-300">
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
          <div>
            <h1 className="m-0 text-[30px] font-[800] tracking-[0.01em]">HUB ANNOUNCEMENTS</h1>
            <p className="m-0 mt-[6px] font-mono text-[11px] tracking-[0.2em] text-[#9c8d76]">THE WALL PHONE · MESSAGES TO HUB MEMBERS</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowDemoVideoModal(true)} className="font-bold text-[13px] text-[#5c4f3c] bg-white border border-[#785a32]/20 px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(120,90,50,0.08)] hover:bg-[#f6ebd4] transition-colors">
              Manage Demo Video
            </button>
            <button onClick={() => setShowPdfModal(true)} className="font-bold text-[13px] text-[#5c4f3c] bg-white border border-[#785a32]/20 px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(120,90,50,0.08)] hover:bg-[#f6ebd4] transition-colors">
              Manage Program PDFs
            </button>
            <Link href="/admin/about" className="font-bold text-[13px] text-white bg-steward-green px-4 py-2 rounded-full shadow-md hover:bg-[#2c8a4a] transition-colors">
              Edit Learn More / Contact Us
            </Link>
            <div className="flex items-center gap-[8px] bg-white border border-[#785a32]/[0.16] rounded-full px-4 py-2 shadow-[0_3px_10px_rgba(120,90,50,0.08)]">
              <span className="w-2 h-2 rounded-full bg-[#2c8a4a] shadow-[0_0_0_3px_rgba(44,138,74,0.18)] animate-pulse"></span>
              <span className="font-bold text-[12.5px] text-[#3a6b46] tracking-[0.08em]">LIVE ON HUB</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-[22px] items-start">
          
          {/* Left Column: Post Announcement & List */}
          <div className="flex flex-col gap-[22px]">
            
            {/* Create Announcement Box */}
            <div className="bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
              <div className="font-[800] text-[16px] mb-[3px]">{editingAnnId ? 'Edit Announcement' : 'Ring the phone'}</div>
              <div className="text-[13.5px] text-[#8a7c66] mb-[18px]">{editingAnnId ? 'Modify this message.' : 'Post an announcement — members see the wall phone light up and ring in the Hub until they open it.'}</div>
              
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">TITLE</label>
              <input 
                value={annTitle} 
                onChange={(e) => setAnnTitle(e.target.value)} 
                placeholder="e.g. Cohort 02 applications are open" 
                className="w-full my-[7px] mb-[16px] p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14.5px] outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block">MESSAGE</label>
              <AnnouncementEditor 
                value={annBody} 
                onChange={setAnnBody}
                placeholder="Write the announcement members will read… Add links and images with the toolbar."
              />
              
              <div className="flex gap-[12px]">
                <button 
                  onClick={handlePostAnnouncement}
                  disabled={isPosting}
                  className="px-[22px] py-[13px] rounded-[12px] bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-[14px] shadow-[0_6px_16px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50 flex-1"
                >
                  {isPosting ? (editingAnnId ? 'Saving...' : 'Sending...') : (editingAnnId ? 'Save Changes' : '📞 Send & ring the phone')}
                </button>
                {editingAnnId && (
                  <button 
                    onClick={handleCancelEditAnn}
                    disabled={isPosting}
                    className="px-[22px] py-[13px] rounded-[12px] border border-[#785a32]/20 bg-white text-[#5c4f3c] font-[700] text-[14px] hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>


            {/* Posted Announcements List */}
            <div className="bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
              <div className="flex items-center justify-between mb-[16px]">
                <div className="font-[800] text-[16px]">Posted</div>
                <div className="font-mono text-[11px] text-[#9c8d76]">{announcements.length} TOTAL</div>
              </div>
              
              <div className="flex flex-col gap-[12px]">
                {announcements.map((a, i) => {
                  // Extract plain text preview (no HTML)
                  const plainText = a.body?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';
                  const textPreview = plainText.length > 120 ? plainText.slice(0, 120) + '…' : plainText;
                  // Extract image URLs from body
                  const imgMatches = [...(a.body || '').matchAll(/<img[^>]+src="([^"]+)"/gi)];
                  const imageUrls = imgMatches.map(m => m[1]);
                  // Extract links
                  const linkMatches = [...(a.body || '').matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi)];
                  
                  return (
                  <div key={a.id || i} className="flex gap-[14px] p-[15px] rounded-[14px] bg-[#fdf8ea] border border-[#785a32]/10">
                    <div className="w-[38px] h-[38px] shrink-0 rounded-[10px] bg-[#e2b54a]/[0.16] flex items-center justify-center text-[17px]">📣</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-[10px]">
                        <div className="font-[700] text-[14.5px]">{a.title}</div>
                        <div className="font-mono text-[10.5px] text-[#a89a82] whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-[13px] text-[#7c6f5a] mt-[3px] leading-[1.45]">{textPreview}</div>
                      
                      {/* Links */}
                      {linkMatches.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {linkMatches.map((link, li) => (
                            <a key={li} href={link[1]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#2c8a4a] bg-[#2c8a4a]/8 border border-[#2c8a4a]/15 rounded-full px-2.5 py-1 no-underline hover:bg-[#2c8a4a]/15 transition-colors">
                              🔗 {link[2] || new URL(link[1]).hostname}
                            </a>
                          ))}
                        </div>
                      )}
                      
                      {/* Image thumbnails */}
                      {imageUrls.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {imageUrls.map((url, imgIdx) => (
                            <img key={imgIdx} src={url} alt="" className="w-[56px] h-[56px] object-cover rounded-lg border border-[#785a32]/10 shadow-sm" />
                          ))}
                        </div>
                      )}
                      
                      <div className="inline-flex items-center gap-[6px] mt-[9px] px-[10px] py-[4px] rounded-full bg-[#2c8a4a]/10 font-mono text-[10.5px] tracking-[0.06em] text-[#2f6b3a]">
                        👁 {a.reads} MEMBERS READ
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 ml-2">
                      <button onClick={() => handleEditAnnouncement(a)} className="text-[#8a7c66] hover:text-[#5c4f3c] p-2 bg-white rounded-md border border-[#785a32]/10 shadow-sm transition-colors" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-md border border-red-100 shadow-sm transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  );
                })}
                
                {announcements.length === 0 && (
                  <div className="text-center py-8 text-[#9c8d76] text-sm">No announcements posted yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Phone Preview & Bulletin */}
          <div className="flex flex-col gap-[22px] lg:sticky lg:top-[24px] max-h-[calc(100vh-48px)] overflow-y-auto pb-4 pr-2">
            
            {/* Phone Preview */}
            <div className="bg-gradient-to-br from-[#2a2118] to-[#1a130c] rounded-[20px] p-[26px_22px_30px] shadow-[0_16px_34px_rgba(0,0,0,0.28)] border border-[#e2b54a]/[0.15] text-center">
              <div className="font-mono text-[10px] tracking-[0.22em] text-[#c8963e] mb-[20px]">STUDENT VIEW · THE HUB WALL</div>
              
              <div className={`relative w-[118px] h-[150px] mx-auto ${phoneRinging ? 'origin-[50%_20%] animate-[ring_1.4s_ease-in-out_infinite]' : ''}`}>
                <div className={`absolute left-[34px] top-[14px] w-[76px] h-[126px] rounded-[18px_18px_16px_16px] bg-gradient-to-br from-[#d9a44a] to-[#a97a2c] shadow-[inset_0_3px_6px_rgba(255,235,190,0.45),inset_0_-6px_12px_rgba(120,80,20,0.4),0_8px_16px_rgba(0,0,0,0.4)] ${phoneRinging ? 'shadow-[inset_0_3px_6px_rgba(255,220,160,0.12),0_0_26px_4px_rgba(226,181,74,0.5),0_8px_16px_rgba(0,0,0,0.4)]' : ''}`}></div>
                
                <div className="absolute left-[31px] top-[34px] w-[11px] h-[8px] rounded-[0_4px_4px_0] bg-gradient-to-b from-[#8a6224] to-[#5f4318]"></div>
                <div className="absolute left-[31px] top-[118px] w-[11px] h-[8px] rounded-[0_4px_4px_0] bg-gradient-to-b from-[#8a6224] to-[#5f4318]"></div>
                
                <svg width="50" height="50" viewBox="0 0 50 50" className="absolute left-[47px] top-[44px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                  <circle cx="25" cy="25" r="24" fill="#c69433"></circle>
                  <circle cx="25" cy="25" r="24" fill="none" stroke="rgba(255,238,196,.6)" strokeWidth="1.3"></circle>
                  <circle cx="25" cy="25" r="8" fill="#8f6e26"></circle>
                  <g fill="#3a2c1c">
                    <circle cx="25" cy="7" r="2.4"></circle>
                    <circle cx="35.6" cy="10.4" r="2.4"></circle>
                    <circle cx="42.1" cy="19.4" r="2.4"></circle>
                    <circle cx="42.1" cy="30.6" r="2.4"></circle>
                    <circle cx="35.6" cy="39.6" r="2.4"></circle>
                    <circle cx="25" cy="43" r="2.4"></circle>
                    <circle cx="14.4" cy="39.6" r="2.4"></circle>
                    <circle cx="7.9" cy="30.6" r="2.4"></circle>
                    <circle cx="7.9" cy="19.4" r="2.4"></circle>
                    <circle cx="14.4" cy="10.4" r="2.4"></circle>
                  </g>
                  <rect x="40" y="28" width="7" height="5" rx="2.5" fill="#5f4318"></rect>
                </svg>

                <div className="absolute left-[4px] top-[8px] w-[32px] h-[134px] -rotate-2">
                  <div className="absolute left-1/2 top-[18px] bottom-[18px] -translate-x-1/2 w-[13px] rounded-[8px] bg-gradient-to-r from-[#b08a58] to-[#6a4d2b] shadow-[2px_0_4px_rgba(0,0,0,0.35),inset_1px_0_1px_rgba(255,225,175,0.35)]"></div>
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[30px] h-[32px] rounded-[15px] bg-gradient-to-br from-[#b98f5a] to-[#7a5a34] shadow-[0_3px_5px_rgba(0,0,0,0.35),inset_0_2px_3px_rgba(255,232,188,0.42)]">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle, #3a2c1c 1px, transparent 1.6px)', backgroundSize: '4px 4px' }}></div>
                  </div>
                  <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[30px] h-[32px] rounded-[15px] bg-gradient-to-br from-[#b98f5a] to-[#7a5a34] shadow-[0_3px_5px_rgba(0,0,0,0.35),inset_0_2px_3px_rgba(255,232,188,0.42)]">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] rounded-full opacity-70" style={{ background: 'radial-gradient(circle, #3a2c1c 1px, transparent 1.6px)', backgroundSize: '4px 4px' }}></div>
                  </div>
                </div>
              </div>
              
              <div className={`mt-[18px] font-[700] text-[12.5px] tracking-[0.06em] ${phoneLabelClass}`}>
                {phoneStatus}
              </div>
            </div>

            {/* Project Bulletin */}
            <div className="bg-white rounded-[20px] p-[24px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
              <div className="flex items-center gap-[8px] mb-[5px]">
                <Pin size={18} className="text-[#c8963e]" />
                <div className="font-[800] text-[15.5px]">Project Bulletin</div>
              </div>
              <div className="text-[12.5px] text-[#8a7c66] mb-[14px]">The pinned notice shown on the Hub board — always visible, no ring.</div>
              
              <textarea 
                value={bulletinText} 
                onChange={(e) => setBulletinText(e.target.value)} 
                className="w-full p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[13.5px] min-h-[90px] resize-y leading-relaxed outline-none focus:border-[#785a32]/40 transition-colors"
              />
              
              <button 
                onClick={handleSaveBulletin}
                disabled={isSavingBulletin}
                className="mt-[14px] w-full p-[12px] rounded-[11px] border border-[#785a32]/20 bg-[#fbf5e6] text-[#5c4f3c] font-[700] text-[13.5px] hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                {isSavingBulletin ? 'Saving...' : 'Update bulletin'}
              </button>
            </div>
          </div>
        </div>

        {/* Program Documents (PDFs) Modal */}
        {showPdfModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Pin size={20} className="text-[#2c8a4a]" />
                  <h3 className="text-[20px] font-[800] text-[#241c12]">Manage Program Documents</h3>
                </div>
                <button onClick={() => setShowPdfModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
              
              <div className="text-[14px] text-[#8a7c66] mb-6">
                Manage the PDFs shown on the Hub page (e.g. Stewardworks Principles, Credo).
              </div>

              <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Upload/Edit Form */}
                <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-xl p-5">
                  <div className="mb-4">
                    <label className="font-mono text-[11px] tracking-[0.18em] text-[#9c8d76] block mb-1">BUTTON LABEL</label>
                    <input value={docLabel} onChange={(e) => setDocLabel(e.target.value)} placeholder="e.g. Stewardworks Principles" className="w-full p-2.5 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none focus:border-[#2c8a4a]" />
                  </div>
                  <div className="mb-4">
                    <label className="font-mono text-[11px] tracking-[0.18em] text-[#9c8d76] block mb-1">PDF FILE</label>
                    <div className="flex gap-2 items-center flex-wrap">
                      <label className="cursor-pointer bg-white border border-[#785a32]/20 text-[#5c4f3c] text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-[#f6ebd4] transition-colors shadow-sm">
                        {isUploadingDoc ? 'Uploading...' : 'Upload PDF'}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploadingDoc} />
                      </label>
                      {docPdfUrl && (
                        <a href={docPdfUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#2c8a4a] underline break-all max-w-[200px] truncate">
                          {docPdfUrl.split('/').pop()}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleSaveDoc}
                      disabled={isSavingDoc || !docPdfUrl}
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-b from-[#2c8a4a] to-[#1e6134] text-white font-[800] text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSavingDoc ? 'Saving...' : editingDocId ? 'Save Changes' : 'Add Document'}
                    </button>
                    {editingDocId && (
                      <button 
                        onClick={handleCancelEditDoc}
                        className="px-4 py-2.5 rounded-lg border border-[#785a32]/20 bg-white text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Documents List */}
                <div className="flex flex-col gap-3">
                  {programDocuments.length === 0 ? (
                    <div className="text-center py-8 text-[#9c8d76] text-sm bg-gray-50 rounded-xl border border-dashed border-gray-300">No documents uploaded yet.</div>
                  ) : (
                    programDocuments.map((doc, idx) => (
                      <div key={doc.id} className={`flex items-center gap-3 p-3.5 rounded-xl border border-[#785a32]/10 ${!doc.is_active ? 'bg-gray-50 opacity-60' : 'bg-[#fbf5e6]'}`}>
                        <div className="text-[20px]">📄</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-[700] text-[14px] text-[#241c12] truncate">{doc.label}</div>
                          <a href={doc.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#2c8a4a] hover:underline truncate block mt-0.5">View PDF</a>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleToggleDocActive(doc)} className="text-[11px] font-bold px-2 py-1 rounded bg-white border border-[#785a32]/20 text-[#5c4f3c] hover:bg-gray-100 shadow-sm" title={doc.is_active ? "Hide on Hub" : "Show on Hub"}>
                            {doc.is_active ? 'ON' : 'OFF'}
                          </button>
                          <button onClick={() => handleEditDoc(doc)} className="p-1.5 bg-white rounded border border-[#785a32]/20 text-[#8a7c66] hover:text-[#5c4f3c] shadow-sm" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 bg-white rounded border border-red-100 text-red-400 hover:text-red-600 shadow-sm" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Video Modal */}
        {showDemoVideoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Video size={20} className="text-[#c8963e]" />
                  <h3 className="text-[20px] font-[800] text-[#241c12]">Manage Demo Video</h3>
                </div>
                <button onClick={() => setShowDemoVideoModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>
              
              <div className="text-[14px] text-[#8a7c66] mb-6">
                Configure the demo video shown to first-time users on the Hub page. You can paste a YouTube link or upload a video directly.
              </div>

              <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-xl p-5">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. https://youtube.com/watch?v=... or upload below"
                    value={demoVideoUrl} 
                    onChange={(e) => setDemoVideoUrl(e.target.value)} 
                    className="flex-1 p-[13px_15px] rounded-[11px] border border-[#785a32]/20 bg-white text-[13.5px] outline-none focus:border-[#2c8a4a] transition-colors"
                  />
                  <label className={`cursor-pointer px-4 py-3 rounded-[11px] border border-[#785a32]/20 bg-white hover:bg-gray-50 flex items-center justify-center text-[13.5px] font-bold text-[#5c4f3c] transition-colors ${isUploadingDemoVideo ? 'opacity-50' : ''}`}>
                    <input type="file" accept="video/*" className="hidden" onChange={handleUploadDemoVideo} disabled={isUploadingDemoVideo} />
                    {isUploadingDemoVideo ? 'Uploading...' : 'Upload Video'}
                  </label>
                </div>

                {demoVideoUrl && (
                  <div className="mt-[14px] flex gap-2">
                    <button 
                      onClick={handleDeleteDemoVideo}
                      disabled={isSavingDemoVideo}
                      className="flex-1 p-[12px] rounded-[11px] border border-red-200 bg-red-50 text-red-600 font-[700] text-[13.5px] hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Delete Video
                    </button>
                    <button 
                      onClick={async () => {
                        await handleSaveDemoVideoUrl();
                        setShowDemoVideoModal(false);
                      }}
                      disabled={isSavingDemoVideo}
                      className="flex-1 p-[12px] rounded-[11px] border border-[#2c8a4a]/20 bg-[#2c8a4a] text-white font-[700] text-[13.5px] hover:bg-[#247840] transition-colors disabled:opacity-50"
                    >
                      {isSavingDemoVideo ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
                
                {!demoVideoUrl && (
                  <button 
                    onClick={async () => {
                      await handleSaveDemoVideoUrl();
                      setShowDemoVideoModal(false);
                    }}
                    disabled={isSavingDemoVideo}
                    className="mt-[14px] w-full p-[12px] rounded-[11px] border border-[#2c8a4a]/20 bg-[#2c8a4a] text-white font-[700] text-[13.5px] hover:bg-[#247840] transition-colors disabled:opacity-50"
                  >
                    {isSavingDemoVideo ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Public Bulletin Management */}
        <div className="mt-[22px] bg-white rounded-[20px] p-[26px] shadow-[0_12px_30px_rgba(120,90,50,0.1)] border border-[#785a32]/[0.08]">
          <div className="flex items-center justify-between gap-[14px] flex-wrap mb-[4px]">
            <div className="flex items-center gap-[9px]">
              <Globe size={18} className="text-blue-500" />
              <div className="font-[800] text-[16px]">Public Bulletin Editor</div>
            </div>
            <a href="/onboarding/bulletin" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] tracking-[0.02em] text-[#8a6a2a] no-underline bg-[#fbf0da] border border-[#c8963e]/30 rounded-full px-[14px] py-[7px] hover:bg-[#f6e5c3] transition-colors">
              stewardworks.space/onboarding/bulletin ↗
            </a>
          </div>
          <div className="text-[13.5px] text-[#8a7c66] mb-[20px] max-w-[660px]">
            The public-facing page people see before they join — open to everyone, no login.
          </div>
          
          <div className="grid lg:grid-cols-2 gap-[32px] items-start">
            
            {/* Updates Column */}
            <div>
              <h3 className="font-[800] text-[18px] mb-4">Project Updates</h3>
              
              {/* Form */}
              <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-[12px] p-4 mb-6 relative">
                {editingUpdateId && (
                  <div className="absolute -top-3 right-4 bg-[#B85C3E] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                    Editing Mode
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">TAG (e.g. Onboarding)</label>
                    <input value={upTag} onChange={(e) => setUpTag(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">BUTTON LABEL</label>
                    <input value={upCta} onChange={(e) => setUpCta(e.target.value)} placeholder="Learn more" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">TITLE</label>
                  <input value={upTitle} onChange={(e) => setUpTitle(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">BODY SUMMARY</label>
                  <textarea value={upBody} onChange={(e) => setUpBody(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm min-h-[60px] outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">FULL DETAILS (Popup)</label>
                  <textarea value={upDetail} onChange={(e) => setUpDetail(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm min-h-[60px] outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">URL LINK (Optional)</label>
                  <input value={upLink} onChange={(e) => setUpLink(e.target.value)} placeholder="https://" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">IMAGE UPLOAD (Optional)</label>
                  <div 
                    className={`w-full h-[120px] rounded-lg border-2 border-dashed border-[#785a32]/20 bg-white flex items-center justify-center text-[#9c8d76] font-bold text-xs relative overflow-hidden group cursor-pointer ${isSavingUp ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ backgroundImage: upImage ? `url(${upImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    {!upImage && !isSavingUp && <span>Drop update image</span>}
                    {isSavingUp && <span className="animate-pulse">Uploading...</span>}
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsSavingUp(true);
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/admin/upload-media', { method: 'POST', body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setUpImage(data.publicUrl);
                            } else {
                              toast.error('Failed to upload image');
                            }
                          } catch (err) {
                            toast.error('Network error during upload');
                          } finally {
                            setIsSavingUp(false);
                          }
                        }
                      }} disabled={isSavingUp} />
                      <div className="bg-white text-steward-dark px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-widest shadow-lg">
                        {upImage ? 'Replace Image' : 'Upload Image'}
                      </div>
                    </label>
                  </div>
                  {upImage && (
                    <button 
                      onClick={() => setUpImage('')}
                      className="mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 disabled:opacity-50"
                      disabled={isSavingUp}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveUpdate}
                    disabled={isSavingUp}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-sm shadow-[0_4px_10px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSavingUp ? 'Saving...' : editingUpdateId ? 'Save Changes' : 'Publish Update'}
                  </button>
                  {editingUpdateId && (
                    <button 
                      onClick={handleCancelEditUpdate}
                      disabled={isSavingUp}
                      className="px-4 py-2 rounded-lg border border-[#785a32]/20 bg-white text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex flex-col gap-3">
                {/* Bulk delete toolbar — Updates */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  {!updatesBulkMode ? (
                    <button
                      onClick={() => setUpdatesBulkMode(true)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-[#B85C3E] border border-[#B85C3E]/30 bg-[#F7E7DF] rounded-full px-3 py-1.5 hover:bg-[#f0d0c2] transition-colors"
                    >
                      <Trash2 size={12} /> Delete Bulk
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#5c4f3c] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedUpdateIds.size === updates.length && updates.length > 0}
                          onChange={toggleAllUpdates}
                          className="w-3.5 h-3.5 accent-[#B85C3E]"
                        />
                        Select all
                      </label>
                      <button
                        onClick={() => setBulkDeleteUpdatesConfirm(true)}
                        disabled={selectedUpdateIds.size === 0}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full px-3 py-1.5 hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} /> Delete {selectedUpdateIds.size > 0 ? `(${selectedUpdateIds.size})` : ''}
                      </button>
                      <button
                        onClick={exitUpdatesBulkMode}
                        className="text-[11px] font-bold text-[#5c4f3c] border border-[#785a32]/20 bg-white rounded-full px-3 py-1.5 hover:bg-[#f6ebd4] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {updates.map(u => (
                  <div key={u.id} className={`flex justify-between items-start gap-4 p-4 rounded-xl border bg-[#fdf8ea] transition-colors ${updatesBulkMode && selectedUpdateIds.has(u.id) ? 'border-red-300 bg-red-50' : 'border-[#785a32]/10'}`}>
                    {updatesBulkMode && (
                      <input
                        type="checkbox"
                        checked={selectedUpdateIds.has(u.id)}
                        onChange={() => toggleUpdateSelection(u.id)}
                        className="mt-1 w-4 h-4 accent-[#B85C3E] shrink-0 cursor-pointer"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono tracking-widest text-[#B85C3E] bg-[#F7E7DF] px-2 py-1 rounded-full mb-2 inline-block">{u.tag}</span>
                      <h4 className="font-[700] text-[15px] mb-1">{u.title}</h4>
                      <p className="text-[12px] text-[#7c6f5a] line-clamp-2">{u.body}</p>
                    </div>
                    {!updatesBulkMode && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => handleEditUpdate(u)} className="text-[#8a7c66] hover:text-[#5c4f3c] p-2 bg-white rounded-md border border-[#785a32]/10 shadow-sm transition-colors" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteUpdate(u.id)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-md border border-red-100 shadow-sm transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Events Column */}
            <div>
              <h3 className="font-[800] text-[18px] mb-4">Upcoming Events</h3>
              
              {/* Form */}
              <div className="bg-[#fdfaf0] border border-[#785a32]/20 rounded-[12px] p-4 mb-6 relative">
                {editingEventId && (
                  <div className="absolute -top-3 right-4 bg-[#B85C3E] text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
                    Editing Mode
                  </div>
                )}
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">BADGE (e.g. Listening Session)</label>
                  <input value={evBadge} onChange={(e) => setEvBadge(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">EVENT TITLE</label>
                  <input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">DATE STRING</label>
                    <input value={evDate} onChange={(e) => setEvDate(e.target.value)} placeholder="Thu, Jul 17, 2026" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">TIME STRING</label>
                    <input value={evTime} onChange={(e) => setEvTime(e.target.value)} placeholder="6:00 – 7:30 PM" className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">LOCATION</label>
                  <input value={evLoc} onChange={(e) => setEvLoc(e.target.value)} className="w-full p-2 rounded-lg border border-[#785a32]/20 bg-white text-sm outline-none" />
                </div>
                <div className="mb-3">
                  <label className="font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] block mb-1">EVENT FLYER IMAGE</label>
                  <div 
                    className={`w-full h-[120px] rounded-lg border-2 border-dashed border-[#785a32]/20 bg-white flex items-center justify-center text-[#9c8d76] font-bold text-xs relative overflow-hidden group cursor-pointer ${isSavingEv ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ backgroundImage: evImage ? `url(${evImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    {!evImage && !isSavingEv && <span>Drop event flyer image</span>}
                    {isSavingEv && <span className="animate-pulse">Uploading...</span>}
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsSavingEv(true);
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/admin/upload-media', { method: 'POST', body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setEvImage(data.publicUrl);
                            } else {
                              toast.error('Failed to upload image');
                            }
                          } catch (err) {
                            toast.error('Network error during upload');
                          } finally {
                            setIsSavingEv(false);
                          }
                        }
                      }} disabled={isSavingEv} />
                      <div className="bg-white text-steward-dark px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-widest shadow-lg">
                        {evImage ? 'Replace Image' : 'Upload Image'}
                      </div>
                    </label>
                  </div>
                  {evImage && (
                    <button 
                      onClick={() => setEvImage('')}
                      className="mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 disabled:opacity-50"
                      disabled={isSavingEv}
                    >
                      Remove Flyer
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveEvent}
                    disabled={isSavingEv}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#241609] font-[800] text-sm shadow-[0_4px_10px_rgba(200,150,62,0.3)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSavingEv ? 'Saving...' : editingEventId ? 'Save Changes' : 'Publish Event'}
                  </button>
                  {editingEventId && (
                    <button 
                      onClick={handleCancelEditEvent}
                      disabled={isSavingEv}
                      className="px-4 py-2 rounded-lg border border-[#785a32]/20 bg-white text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex flex-col gap-3">
                {/* Bulk delete toolbar — Events */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  {!eventsBulkMode ? (
                    <button
                      onClick={() => setEventsBulkMode(true)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-[#B85C3E] border border-[#B85C3E]/30 bg-[#F7E7DF] rounded-full px-3 py-1.5 hover:bg-[#f0d0c2] transition-colors"
                    >
                      <Trash2 size={12} /> Delete Bulk
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#5c4f3c] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedEventIds.size === events.length && events.length > 0}
                          onChange={toggleAllEvents}
                          className="w-3.5 h-3.5 accent-[#B85C3E]"
                        />
                        Select all
                      </label>
                      <button
                        onClick={() => setBulkDeleteEventsConfirm(true)}
                        disabled={selectedEventIds.size === 0}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full px-3 py-1.5 hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} /> Delete {selectedEventIds.size > 0 ? `(${selectedEventIds.size})` : ''}
                      </button>
                      <button
                        onClick={exitEventsBulkMode}
                        className="text-[11px] font-bold text-[#5c4f3c] border border-[#785a32]/20 bg-white rounded-full px-3 py-1.5 hover:bg-[#f6ebd4] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {events.map(e => (
                  <div key={e.id} className={`flex justify-between items-start gap-4 p-4 rounded-xl border bg-[#fdf8ea] transition-colors ${eventsBulkMode && selectedEventIds.has(e.id) ? 'border-red-300 bg-red-50' : 'border-[#785a32]/10'}`}>
                    {eventsBulkMode && (
                      <input
                        type="checkbox"
                        checked={selectedEventIds.has(e.id)}
                        onChange={() => toggleEventSelection(e.id)}
                        className="mt-1 w-4 h-4 accent-[#B85C3E] shrink-0 cursor-pointer"
                      />
                    )}
                    <div className="flex gap-3 flex-1 min-w-0">
                      {e.image_url && (
                        <div className="w-[60px] h-[60px] rounded-lg shrink-0 border border-[#785a32]/20 bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${e.image_url})` }} />
                      )}
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-gray-100 bg-[#3B2E20] px-2 py-1 rounded-full mb-2 inline-block">{e.badge}</span>
                        <h4 className="font-[700] text-[15px] mb-1">{e.title}</h4>
                        <p className="text-[12px] text-[#7c6f5a]">📅 {e.event_date} · 🕒 {e.event_time}</p>
                        <p className="text-[12px] text-[#7c6f5a]">📍 {e.location}</p>
                      </div>
                    </div>
                    {!eventsBulkMode && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => handleEditEvent(e)} className="text-[#8a7c66] hover:text-[#5c4f3c] p-2 bg-white rounded-md border border-[#785a32]/10 shadow-sm transition-colors" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteEvent(e.id)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-md border border-red-100 shadow-sm transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>


      </main>

      {/* Delete Announcement Modal */}
      {annToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[400px]">
            <h3 className="text-[18px] font-[800] mb-2 text-[#241c12]">Delete Announcement?</h3>
            <p className="text-[14px] text-[#5c4f3c] mb-6">Are you sure you want to delete this announcement? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setAnnToDelete(null)}
                disabled={isDeletingAnn}
                className="px-4 py-2 rounded-lg border border-[#785a32]/20 text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteAnnouncement}
                disabled={isDeletingAnn}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-[700] text-sm hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingAnn ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Update Modal */}
      {updateToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[400px]">
            <h3 className="text-[18px] font-[800] mb-2 text-[#241c12]">Delete Update?</h3>
            <p className="text-[14px] text-[#5c4f3c] mb-6">Are you sure you want to delete this update? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUpdateToDelete(null)}
                disabled={isDeletingUp}
                className="px-4 py-2 rounded-lg border border-[#785a32]/20 text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteUpdate}
                disabled={isDeletingUp}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-[700] text-sm hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingUp ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[400px]">
            <h3 className="text-[18px] font-[800] mb-2 text-[#241c12]">Delete Event?</h3>
            <p className="text-[14px] text-[#5c4f3c] mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEventToDelete(null)}
                disabled={isDeletingEv}
                className="px-4 py-2 rounded-lg border border-[#785a32]/20 text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteEvent}
                disabled={isDeletingEv}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-[700] text-sm hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingEv ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Updates Modal */}
      {bulkDeleteUpdatesConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[400px]">
            <h3 className="text-[18px] font-[800] mb-2 text-[#241c12]">Delete {selectedUpdateIds.size} Update{selectedUpdateIds.size > 1 ? 's' : ''}?</h3>
            <p className="text-[14px] text-[#5c4f3c] mb-6">This will permanently delete the selected update{selectedUpdateIds.size > 1 ? 's' : ''}. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteUpdatesConfirm(false)}
                disabled={isBulkDeletingUpdates}
                className="px-4 py-2 rounded-lg border border-[#785a32]/20 text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDeleteUpdates}
                disabled={isBulkDeletingUpdates}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-[700] text-sm hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isBulkDeletingUpdates ? 'Deleting...' : `Delete ${selectedUpdateIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Events Modal */}
      {bulkDeleteEventsConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-[#785a32]/10 w-[90%] max-w-[400px]">
            <h3 className="text-[18px] font-[800] mb-2 text-[#241c12]">Delete {selectedEventIds.size} Event{selectedEventIds.size > 1 ? 's' : ''}?</h3>
            <p className="text-[14px] text-[#5c4f3c] mb-6">This will permanently delete the selected event{selectedEventIds.size > 1 ? 's' : ''}. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteEventsConfirm(false)}
                disabled={isBulkDeletingEvents}
                className="px-4 py-2 rounded-lg border border-[#785a32]/20 text-[#5c4f3c] font-[700] text-sm hover:bg-[#f6ebd4] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDeleteEvents}
                disabled={isBulkDeletingEvents}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-[700] text-sm hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isBulkDeletingEvents ? 'Deleting...' : `Delete ${selectedEventIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
