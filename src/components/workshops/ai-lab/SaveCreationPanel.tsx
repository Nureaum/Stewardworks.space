'use client';

import React, { useState, useRef } from 'react';
import { uploadCreationImage } from '@/app/actions/workshops/engagement';
import toast from 'react-hot-toast';

interface SaveCreationPanelProps {
  onSave: (data: { platform: string; url: string; showcase: boolean; previewImageUrl?: string }) => Promise<void>;
}

export default function SaveCreationPanel({ onSave }: SaveCreationPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [platform, setPlatform] = useState<'eden' | 'midjourney' | 'chatgpt' | 'other'>('eden');
  const [shareLink, setShareLink] = useState('');
  const [showcaseSubmit, setShowcaseSubmit] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [urlImgError, setUrlImgError] = useState(false);
  // Separate preview image for non-image URLs (same as Showcase form)
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewFileInputRef = useRef<HTMLInputElement>(null);

  const platformOpts = [
    { id: 'eden', label: 'EDEN.ART', color: '#4dffa0' },
    { id: 'midjourney', label: 'MIDJOURNEY', color: '#45d6ff' },
    { id: 'chatgpt', label: 'CHATGPT', color: '#ff5fd2' },
    { id: 'other', label: 'OTHER', color: '#ffd23f' },
  ];

  const handleSave = async () => {
    if (!shareLink.trim() && !fileToUpload) {
      toast.error('Please paste a creation link or upload an image first.', { position: 'bottom-center' });
      return;
    }
    
    setIsUploading(true);
    try {
      let finalUrl = shareLink;
      
      if (fileToUpload) {
        // Uploaded image file — use its URL as the main asset
        const formData = new FormData();
        formData.append('file', fileToUpload);
        finalUrl = await uploadCreationImage(formData);
      } else if (previewFile && !isDirectImageUrl(shareLink)) {
        // Non-image URL with a separate preview thumbnail — upload the thumbnail
        // and store it in the URL field so it shows up as the card image
        const formData = new FormData();
        formData.append('file', previewFile);
        const uploadedThumb = await uploadCreationImage(formData);
        // Pass both: original share URL as the url, thumbnail as extra metadata via platform prefix
        finalUrl = shareLink;
        await onSave({ platform, url: finalUrl, showcase: showcaseSubmit, previewImageUrl: uploadedThumb });
        setShareLink('');
        setFileToUpload(null);
        setPreviewFile(null);
        setPreviewFileUrl(null);
        setShowcaseSubmit(false);
        return;
      }

      await onSave({ platform, url: finalUrl, showcase: showcaseSubmit });
      setShareLink('');
      setFileToUpload(null);
      setPreviewFile(null);
      setPreviewFileUrl(null);
      setShowcaseSubmit(false);
    } catch (err) {
      console.error('Error saving creation:', err);
      toast.error('Failed to save creation. Please try again.', { position: 'bottom-center' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, GIF, etc.)', { position: 'bottom-center' });
      return;
    }

    setFileToUpload(file);
    const localUrl = URL.createObjectURL(file);
    setShareLink(localUrl);
    setUrlImgError(false);
    setPreviewFile(null);
    setPreviewFileUrl(null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-detect platform from URL
  const detectPlatform = (url: string) => {
    if (url.includes('eden.art')) return 'eden';
    if (url.includes('midjourney.com') || url.includes('discord.com/channels') || url.includes('cdn.discordapp')) return 'midjourney';
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
    return null;
  };

  const handleShareLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setShareLink(val);
    setUrlImgError(false);
    setPreviewFile(null);
    setPreviewFileUrl(null);
    const detected = detectPlatform(val);
    if (detected) setPlatform(detected as any);
  };

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file for the preview thumbnail.', { position: 'bottom-center' });
      return;
    }
    setPreviewFile(file);
    setPreviewFileUrl(URL.createObjectURL(file));
    if (previewFileInputRef.current) previewFileInputRef.current.value = '';
  };

  // Check if a URL looks like a direct image we can preview
  const isDirectImageUrl = (url: string) =>
    /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(url) ||
    url.includes('/storage/v1/object/public/') ||
    url.includes('/public/content-uploads/');


  return (
    <div style={{ 
      marginTop: 14, 
      border: '2px solid var(--ng,#4dffa0)', 
      borderRadius: 10, 
      background: 'linear-gradient(180deg,rgba(77,255,160,.06),var(--pn,#14211b))', 
      padding: '15px 16px' 
    }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        gap: 10, 
        justifyContent: 'space-between', 
        marginBottom: minimized ? 0 : 12 
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
          <div className="font-pixel" style={{ fontSize: 9, color: 'var(--ng,#4dffa0)', letterSpacing: 1 }}>
            ◎ SAVE A CREATION
          </div>
          <div className="font-pixel" style={{ fontSize: 7, color: 'var(--sy,#ffd23f)' }}>
            +2% TOWARD YOUR PROFILE (+1% FOR SHOWCASE)
          </div>
        </div>
        <button 
          onClick={() => setMinimized(!minimized)}
          title={minimized ? 'Expand this panel' : 'Minimize this panel'}
          className="font-pixel"
          style={{ 
            fontSize: 8, 
            color: 'var(--mu,#77b78d)', 
            background: 'rgba(0,0,0,.3)', 
            border: '2px solid var(--ln,#28432f)', 
            borderRadius: 5, 
            padding: '8px 10px', 
            cursor: 'pointer', 
            flex: 'none' 
          }}
        >
          {minimized ? '▾' : '▴'}
        </button>
      </div>

      {!minimized && (
        <>
          <div style={{ 
            fontSize: 18, 
            color: 'var(--mu,#77b78d)', 
            lineHeight: 1.4, 
            marginBottom: 13, 
            maxWidth: 760,
            fontFamily: "'VT323', monospace"
          }}>
            Made something you want to keep? Paste its share link (or upload the file). It lands in your{' '}
            <span style={{ color: 'var(--cy,#45d6ff)' }}>My Portfolio</span> gallery, counts toward your completion %, 
            and goes to your teacher for review.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            {/* Left column */}
            <div style={{ flex: '2 1 360px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: 8 }}>
                  PLATFORM
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {platformOpts.map((po) => (
                    <button
                      key={po.id}
                      onClick={() => setPlatform(po.id as any)}
                      className="font-pixel"
                      style={{
                        fontSize: 8,
                        padding: '8px 12px',
                        borderRadius: 5,
                        border: `2px solid ${platform === po.id ? po.color : 'var(--ln,#28432f)'}`,
                        background: platform === po.id ? `${po.color}22` : 'rgba(0,0,0,.3)',
                        color: platform === po.id ? po.color : 'var(--mu,#77b78d)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {po.label}
                    </button>
                  ))}
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: 'var(--mu,#77b78d)', 
                  marginTop: 7, 
                  lineHeight: 1.35,
                  fontFamily: "'VT323', monospace"
                }}>
                  Auto-detected from the link — override if it's wrong. This tags whether the piece came from Eden or another tool.
                </div>
              </div>

              <div>
                <div className="font-pixel" style={{ fontSize: 7, color: 'var(--mu,#77b78d)', marginBottom: 8 }}>
                  CREATION LINK
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {shareLink.startsWith('blob:') ? (
                    <div style={{
                      flex: '1',
                      minWidth: 200,
                      background: '#08120d',
                      border: '2px solid var(--ln,#28432f)',
                      borderRadius: 5,
                      padding: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <img 
                        src={shareLink} 
                        alt="Upload preview" 
                        style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--mu,#77b78d)' }} 
                      />
                      <div style={{ flex: 1, color: 'var(--tx,#d6ffe0)', fontSize: 15, fontFamily: "'VT323', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileToUpload?.name || 'Uploaded Image'}
                      </div>
                      <button
                        onClick={() => { setShareLink(''); setFileToUpload(null); }}
                        style={{ background: 'none', border: 'none', color: 'var(--mu,#77b78d)', cursor: 'pointer', padding: 4 }}
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                  <input
                      value={shareLink}
                      onChange={handleShareLinkChange}
                      placeholder="https://app.eden.art/creations/…  or  any tool's share link"
                      style={{
                        flex: '1',
                        minWidth: 200,
                        background: '#08120d',
                        border: `2px solid ${shareLink.trim() ? 'var(--ng,#4dffa0)' : 'var(--ln,#28432f)'}`,
                        borderRadius: 5,
                        color: 'var(--tx,#d6ffe0)',
                        fontSize: 17,
                        padding: '10px 11px',
                        fontFamily: "'VT323', monospace",
                        transition: 'border-color .2s',
                      }}
                    />
                  )}
                  <button
                    onClick={handleUploadClick}
                    title="Upload an image file"
                    className="font-pixel"
                    style={{
                      fontSize: 8,
                      color: 'var(--cy,#45d6ff)',
                      background: 'none',
                      border: '2px solid var(--cy,#45d6ff)',
                      borderRadius: 5,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⤒ UPLOAD
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: 'var(--mu,#77b78d)', 
                  marginTop: 7, 
                  lineHeight: 1.35,
                  fontFamily: "'VT323', monospace"
                }}>
                  Paste a share link from any AI tool, or click UPLOAD to select an image file from your device.
                </div>
              </div>
              
              {/* URL Preview — shown after typing/pasting a non-blob URL */}
              {shareLink && !shareLink.startsWith('blob:') && (
                <div style={{
                  marginTop: 10,
                  border: '1.5px solid var(--ln,#28432f)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,.3)',
                }}>
                  {/* Direct image URL — show inline thumbnail */}
                  {isDirectImageUrl(shareLink) && !urlImgError ? (
                    <img
                      src={shareLink}
                      alt="Preview"
                      onError={() => setUrlImgError(true)}
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    /* Non-image URL — show link + optional preview image upload */
                    <>
                      {previewFileUrl ? (
                        /* Preview thumbnail was added */
                        <div style={{ position: 'relative' }}>
                          <img
                            src={previewFileUrl}
                            alt="Preview thumbnail"
                            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                          />
                          <button
                            onClick={() => { setPreviewFile(null); setPreviewFileUrl(null); }}
                            style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: '1px solid rgba(77,255,160,.4)', color: 'var(--ng,#4dffa0)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                            title="Remove preview image"
                          >×</button>
                        </div>
                      ) : (
                        /* Link icon + URL */
                        <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--mu,#77b78d)', fontFamily: "'DM Mono',monospace", wordBreak: 'break-all' }}>
                          🔗 {shareLink}
                        </div>
                      )}
                      {/* + ADD PREVIEW IMAGE button */}
                      {!previewFileUrl && (
                        <div style={{ padding: '8px 12px', borderTop: '1px dashed var(--ln,#28432f)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            onClick={() => previewFileInputRef.current?.click()}
                            className="font-pixel"
                            style={{ fontSize: 8, padding: '8px 14px', background: 'rgba(69,214,255,.1)', color: 'var(--cy,#45d6ff)', border: '1.5px solid rgba(69,214,255,.3)', borderRadius: 6, cursor: 'pointer', letterSpacing: '.5px' }}
                          >
                            📷 + ADD PREVIEW IMAGE
                          </button>
                          <span style={{ fontSize: 10, color: 'var(--mu,#77b78d)', fontFamily: "'DM Mono',monospace" }}>Optional thumbnail</span>
                          <input
                            ref={previewFileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handlePreviewFileChange}
                          />
                        </div>
                      )}
                    </>
                  )}
                  {/* Footer label */}
                  <div style={{ padding: '5px 12px', fontSize: 10, color: 'var(--ng,#4dffa0)', fontFamily: "'DM Mono',monospace", borderTop: '1px solid var(--ln,#28432f)' }}>
                    {previewFile
                      ? `DETECTED: LINK · 📷 Preview: ${previewFile.name}`
                      : isDirectImageUrl(shareLink) && !urlImgError
                        ? 'DETECTED: IMAGE'
                        : 'DETECTED: LINK'}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <button
                onClick={() => setShowcaseSubmit(!showcaseSubmit)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 13px',
                  background: 'rgba(0,0,0,.2)',
                  border: `2px solid ${showcaseSubmit ? 'var(--pk,#ff5fd2)' : 'var(--ln,#28432f)'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 15,
                  color: 'var(--tx,#d6ffe0)',
                  fontFamily: "'VT323', monospace",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    border: '2px solid var(--pk,#ff5fd2)',
                    borderRadius: 3,
                    background: showcaseSubmit ? 'var(--pk,#ff5fd2)' : 'transparent',
                    color: showcaseSubmit ? '#0e1512' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}
                >
                  {showcaseSubmit ? '✓' : ''}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.3 }}>
                  Submit to the curated <b>Student Showcase</b>
                </span>
              </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 200px' }}>
          <button
            onClick={handleSave}
            disabled={isUploading || (!shareLink && !fileToUpload)}
            className="font-pixel"
            style={{ 
              width: '100%', 
              background: (isUploading || (!shareLink && !fileToUpload)) ? 'var(--ln,#28432f)' : 'var(--ng,#4dffa0)', 
              color: 'var(--pn,#14211b)', 
              border: 'none', 
              borderRadius: 6, 
              padding: '12px 14px', 
              fontSize: 10, 
              letterSpacing: 1, 
              cursor: (isUploading || (!shareLink && !fileToUpload)) ? 'not-allowed' : 'pointer'
            }}
          >
            {isUploading ? 'SAVING...' : '＋ SAVE TO MY PORTFOLIO'}
          </button>
          <div style={{ fontSize: 14, color: 'var(--mu,#77b78d)', lineHeight: 1.3, fontFamily: "'VT323', monospace" }}>
            Student assets are reviewed by faculty before appearing in your public portfolio or the showcase. <br/>
            <span style={{ color: 'var(--sy,#ffd23f)' }}>* Submitting to the Showcase grants an extra <b>+1% engagement</b> upon approval (3% total).</span>
          </div>
        </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
