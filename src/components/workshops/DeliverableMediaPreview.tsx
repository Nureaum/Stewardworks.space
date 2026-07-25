'use client'

import React, { useState } from 'react'

interface DeliverableMediaPreviewProps {
  url: string
  variant?: 'thumbnail' | 'full'  // thumbnail = small icon, full = large preview
  theme?: 'dark' | 'light'       // dark for game/journey UI, light for admin pages
  showPreviewButton?: boolean    // show a "Preview" button for full-size popup
  maxThumbnailSize?: number      // px for thumbnail mode
}

// Helper to detect if URL is an image
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.ico']
  const lowerUrl = url.toLowerCase()
  // Exclude known video/audio extensions first
  const nonImageExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a']
  if (nonImageExtensions.some(ext => lowerUrl.includes(ext))) return false
  // Check for common image file extensions (even with query params)
  if (imageExtensions.some(ext => {
    const idx = lowerUrl.indexOf(ext)
    if (idx === -1) return false
    // Make sure it's at end of path or before query string
    const afterExt = lowerUrl[idx + ext.length]
    return !afterExt || afterExt === '?' || afterExt === '#' || afterExt === '&'
  })) return true
  // Common image hosting services (only if not video/audio)
  if (lowerUrl.includes('supabase') && lowerUrl.includes('/storage/')) return true
  if (lowerUrl.includes('/content-uploads/')) return true
  if (lowerUrl.includes('/uploads/')) return true
  if (lowerUrl.includes('images.unsplash.com')) return true
  if (lowerUrl.includes('i.imgur.com')) return true
  if (lowerUrl.includes('pbs.twimg.com')) return true
  if (lowerUrl.includes('cdn.discordapp.com') && lowerUrl.includes('/attachments/')) return true
  if (lowerUrl.includes('media.giphy.com')) return true
  if (lowerUrl.includes('cloudinary.com') && lowerUrl.includes('/image/')) return true
  if (lowerUrl.includes('firebasestorage.googleapis.com')) return true
  if (lowerUrl.includes('googleusercontent.com')) return true
  // Eden Art CDN direct image URLs (not the app.eden.art page URLs)
  if (lowerUrl.includes('cdn.eden.art')) return true
  if (lowerUrl.includes('storage.eden.art')) return true
  return false
}

// Helper to detect if URL is a creation/art platform page (not a direct image)
function isCreationPlatformUrl(url: string): { isPlatform: boolean; label: string; icon: string } {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('app.eden.art/creations')) return { isPlatform: true, label: 'Eden Art Creation', icon: '🎨' }
  if (lowerUrl.includes('eden.art/creations')) return { isPlatform: true, label: 'Eden Art Creation', icon: '🎨' }
  if (lowerUrl.includes('midjourney.com')) return { isPlatform: true, label: 'Midjourney', icon: '🎨' }
  if (lowerUrl.includes('openai.com/dall-e') || lowerUrl.includes('labs.openai.com')) return { isPlatform: true, label: 'DALL·E', icon: '🎨' }
  if (lowerUrl.includes('canva.com')) return { isPlatform: true, label: 'Canva Design', icon: '🎨' }
  if (lowerUrl.includes('figma.com')) return { isPlatform: true, label: 'Figma', icon: '🎨' }
  if (lowerUrl.includes('docs.google.com')) return { isPlatform: true, label: 'Google Doc', icon: '📄' }
  if (lowerUrl.includes('drive.google.com')) return { isPlatform: true, label: 'Google Drive', icon: '📁' }
  return { isPlatform: false, label: '', icon: '' }
}

// Helper to detect if URL is a video (embeddable platform or direct file)
function isVideoUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('loom.com')
}

// Helper to detect direct video file URLs
function isDirectVideoUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv)(\?|#|$)/i.test(lowerUrl) || (lowerUrl.includes('supabase') && lowerUrl.includes('/storage/') && /\.(mp4|webm|mov|avi|mkv)/i.test(lowerUrl))
}

// Helper to detect direct audio file URLs
function isDirectAudioUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  return /\.(mp3|wav|ogg|aac|flac|m4a)(\?|#|$)/i.test(lowerUrl) || (lowerUrl.includes('supabase') && lowerUrl.includes('/storage/') && /\.(mp3|wav|ogg|aac|flac|m4a)/i.test(lowerUrl))
}

// Get YouTube embed URL
function getYouTubeEmbedUrl(url: string): string {
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    const videoId = urlParams.get('v')
    return `https://www.youtube.com/embed/${videoId}`
  }
  if (url.includes('youtube.com/embed/')) return url
  return url
}

// Get YouTube thumbnail
function getYouTubeThumbnail(url: string): string | null {
  let videoId: string | null = null
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0]
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    videoId = urlParams.get('v')
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1].split('?')[0]
  }
  return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
}

export default function DeliverableMediaPreview({
  url,
  variant = 'thumbnail',
  theme = 'dark',
  showPreviewButton = false,
  maxThumbnailSize = 48,
}: DeliverableMediaPreviewProps) {
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [imgError, setImgError] = useState(false)

  if (!url) return null

  const cleanUrl = url.replace('[SHOWCASE_REQUESTED]', '').replace(/Selected Principle ID:.*$/, '').trim()
  if (!cleanUrl) return null

  const isImage = isImageUrl(cleanUrl)
  const isVideo = isVideoUrl(cleanUrl)
  const isDirectVideo = isDirectVideoUrl(cleanUrl)
  const isDirectAudio = isDirectAudioUrl(cleanUrl)
  const ytThumb = isVideo ? getYouTubeThumbnail(cleanUrl) : null
  const platform = isCreationPlatformUrl(cleanUrl)
  // Only try as image if it passes the known image detection — don't guess for random URLs
  const shouldTryAsImage = isImage

  // Thumbnail mode - small icon
  if (variant === 'thumbnail') {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {shouldTryAsImage && !imgError ? (
            <div style={{ position: 'relative', cursor: showPreviewButton ? 'pointer' : 'default' }}
              onClick={() => showPreviewButton && setShowFullPreview(true)}
            >
              <img
                src={cleanUrl}
                alt="Deliverable"
                onError={() => setImgError(true)}
                style={{
                  width: maxThumbnailSize,
                  height: maxThumbnailSize,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb',
                  background: theme === 'dark' ? 'rgba(0,0,0,.3)' : '#f9fafb',
                }}
              />
              {showPreviewButton && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 6,
                  background: 'rgba(0,0,0,.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>👁</span>
                </div>
              )}
            </div>
          ) : isVideo && ytThumb ? (
            <div style={{ position: 'relative', cursor: showPreviewButton ? 'pointer' : 'default' }}
              onClick={() => showPreviewButton && setShowFullPreview(true)}
            >
              <img
                src={ytThumb}
                alt="Video thumbnail"
                onError={() => setImgError(true)}
                style={{
                  width: maxThumbnailSize * 1.5,
                  height: maxThumbnailSize,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb',
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 11, color: '#fff', marginLeft: 2 }}>▶</span>
                </div>
              </div>
            </div>
          ) : isDirectVideo ? (
            <div style={{ position: 'relative', cursor: showPreviewButton ? 'pointer' : 'default', width: maxThumbnailSize * 1.5, height: maxThumbnailSize }}
              onClick={() => showPreviewButton && setShowFullPreview(true)}
            >
              <video
                src={cleanUrl}
                preload="metadata"
                muted
                style={{
                  width: maxThumbnailSize * 1.5,
                  height: maxThumbnailSize,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb',
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 11, color: '#fff', marginLeft: 2 }}>▶</span>
                </div>
              </div>
            </div>
          ) : isDirectAudio ? (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: maxThumbnailSize, height: maxThumbnailSize,
              borderRadius: 6,
              background: theme === 'dark' ? 'linear-gradient(135deg, #1a0e2e, #3d2668)' : '#f0f0ff',
              border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb',
              cursor: showPreviewButton ? 'pointer' : 'default',
            }}
              onClick={() => showPreviewButton && setShowFullPreview(true)}
            >
              <span style={{ fontSize: 20 }}>🎵</span>
            </div>
          ) : (
            // Generic link or recognized platform - show icon with optional label
            <a
              href={cleanUrl.startsWith('http') ? cleanUrl : cleanUrl.startsWith('/') ? cleanUrl : `https://${cleanUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
              title={cleanUrl}
            >
              <div style={{
                width: maxThumbnailSize,
                height: maxThumbnailSize,
                borderRadius: 6,
                border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb',
                background: theme === 'dark' ? 'rgba(0,0,0,.3)' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}>
                {platform.isPlatform ? platform.icon : '🔗'}
              </div>
              {platform.isPlatform && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: theme === 'dark' ? 13 : 13,
                    fontFamily: theme === 'dark' ? "'VT323', monospace" : 'inherit',
                    color: theme === 'dark' ? 'var(--s,#45d6ff)' : '#2563eb',
                    fontWeight: 600,
                  }}>
                    {platform.label}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: theme === 'dark' ? 'var(--mu,#a493c9)' : '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 180,
                  }}>
                    Open in new tab ↗
                  </div>
                </div>
              )}
            </a>
          )}

          {showPreviewButton && (shouldTryAsImage || isVideo || isDirectVideo) && !imgError && (
            <button
              onClick={() => setShowFullPreview(true)}
              style={{
                fontSize: theme === 'dark' ? 12 : 13,
                fontFamily: theme === 'dark' ? "'VT323', monospace" : 'inherit',
                color: theme === 'dark' ? 'var(--s,#45d6ff)' : '#2563eb',
                background: 'transparent',
                border: theme === 'dark' ? '1px solid var(--s,#45d6ff)' : '1px solid #2563eb',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Preview
            </button>
          )}
        </div>

        {/* Full Preview Popup */}
        {showFullPreview && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
            onClick={() => setShowFullPreview(false)}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: theme === 'dark' ? '#1a1030' : '#fff',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowFullPreview(false)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 10,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.6)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>

              {shouldTryAsImage && (
                <img
                  src={cleanUrl}
                  alt="Full preview"
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              )}

              {isVideo && (
                <div style={{ width: 'min(90vw, 800px)', aspectRatio: '16/9' }}>
                  <iframe
                    src={getYouTubeEmbedUrl(cleanUrl)}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {isDirectVideo && (
                <div style={{ width: 'min(90vw, 800px)' }}>
                  <video
                    src={cleanUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', maxHeight: '85vh', borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // Full mode - larger inline preview
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shouldTryAsImage && !imgError ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={cleanUrl}
              alt="Deliverable"
              onError={() => setImgError(true)}
              style={{
                maxWidth: '100%',
                maxHeight: 300,
                objectFit: 'contain',
                borderRadius: 8,
                border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb',
                background: theme === 'dark' ? 'rgba(0,0,0,.3)' : '#f9fafb',
                cursor: 'pointer',
              }}
              onClick={() => setShowFullPreview(true)}
            />
          </div>
        ) : isVideo ? (
          <div style={{ aspectRatio: '16/9', maxWidth: 480, borderRadius: 8, overflow: 'hidden', border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb' }}>
            <iframe
              src={getYouTubeEmbedUrl(cleanUrl)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : isDirectVideo ? (
          <div style={{ maxWidth: 480, borderRadius: 8, overflow: 'hidden', border: theme === 'dark' ? '2px solid var(--ln,#3d2668)' : '2px solid #e5e7eb' }}>
            <video
              src={cleanUrl}
              controls
              preload="metadata"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        ) : (
          <a
            href={cleanUrl.startsWith('http') ? cleanUrl : cleanUrl.startsWith('/') ? cleanUrl : `https://${cleanUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 14,
              color: theme === 'dark' ? 'var(--s,#45d6ff)' : '#2563eb',
              textDecoration: 'none',
              wordBreak: 'break-all',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{platform.isPlatform ? platform.icon : '🔗'}</span>
            <span>
              {platform.isPlatform && (
                <span style={{ fontWeight: 700, marginRight: 6 }}>{platform.label}</span>
              )}
              <span style={{ textDecoration: 'underline', opacity: 0.8 }}>
                {platform.isPlatform ? 'Open in new tab ↗' : cleanUrl}
              </span>
            </span>
          </a>
        )}

        {showPreviewButton && (shouldTryAsImage || isVideo || isDirectVideo) && !imgError && (
          <button
            onClick={() => setShowFullPreview(true)}
            style={{
              alignSelf: 'flex-start',
              fontSize: theme === 'dark' ? 13 : 13,
              fontFamily: theme === 'dark' ? "'VT323', monospace" : 'inherit',
              color: theme === 'dark' ? 'var(--s,#45d6ff)' : '#2563eb',
              background: 'transparent',
              border: theme === 'dark' ? '1px solid var(--s,#45d6ff)' : '1px solid #2563eb',
              borderRadius: 4,
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            🔍 View Full Size
          </button>
        )}
      </div>

      {/* Full Preview Popup */}
      {showFullPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowFullPreview(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: theme === 'dark' ? '#1a1030' : '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullPreview(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,.6)',
                color: '#fff',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>

            {shouldTryAsImage && (
              <img
                src={cleanUrl}
                alt="Full preview"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}

            {isVideo && (
              <div style={{ width: 'min(90vw, 800px)', aspectRatio: '16/9' }}>
                <iframe
                  src={getYouTubeEmbedUrl(cleanUrl)}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}

            {isDirectVideo && (
              <div style={{ width: 'min(90vw, 800px)' }}>
                <video
                  src={cleanUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '85vh', borderRadius: 8 }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
