'use client';

import React, { useState, useRef } from 'react';
import { uploadCreationImage } from '@/app/actions/workshops/engagement';
import toast from 'react-hot-toast';

interface SaveCreationPanelProps {
  onSave: (data: { platform: string; url: string; showcase: boolean }) => Promise<void>;
}

export default function SaveCreationPanel({ onSave }: SaveCreationPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [platform, setPlatform] = useState<'eden' | 'midjourney' | 'chatgpt' | 'other'>('eden');
  const [shareLink, setShareLink] = useState('');
  const [showcaseSubmit, setShowcaseSubmit] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const formData = new FormData();
        formData.append('file', fileToUpload);
        finalUrl = await uploadCreationImage(formData);
      }

      await onSave({ platform, url: finalUrl, showcase: showcaseSubmit });
      setShareLink('');
      setFileToUpload(null);
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
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
            +2% TOWARD YOUR PROFILE
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
                      onChange={(e) => setShareLink(e.target.value)}
                      placeholder="https://app.eden.art/creations/…  or  any tool's share link"
                      style={{
                        flex: '1',
                        minWidth: 200,
                        background: '#08120d',
                        border: '2px solid var(--ln,#28432f)',
                        borderRadius: 5,
                        color: 'var(--tx,#d6ffe0)',
                        fontSize: 17,
                        padding: '10px 11px',
                        fontFamily: "'VT323', monospace",
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
          <div style={{ fontSize: 13, color: 'var(--mu,#77b78d)', lineHeight: 1.3 }}>
            Student assets are reviewed by faculty before appearing in your public portfolio or the showcase.
          </div>
        </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
