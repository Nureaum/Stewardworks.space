'use client';

/**
 * PathwayCardDownload
 * -------------------
 * Reusable component that renders a "Preview" and "Download PDF" button
 * for any pathway / run card rendered in the DOM.
 *
 * Usage:
 *   <PathwayCardDownload
 *     cardElementId="pathway-card-creator"
 *     fileName="creator-pathway-card"
 *     accentColor="#ff7e40"
 *   />
 *
 * Uses the same html2canvas + jsPDF pipeline as certificate downloads.
 */

import React, { useState, useCallback } from 'react';

interface PathwayCardDownloadProps {
  /** The `id` of the DOM element to capture */
  cardElementId: string;
  /** Base name for the downloaded file (no extension) */
  fileName?: string;
  /** Accent colour for the Preview button */
  accentColor?: string;
  /** Button size variant */
  size?: 'sm' | 'md';
  /** Additional wrapper style */
  style?: React.CSSProperties;
  /** Font family for button labels */
  fontFamily?: string;
}

export default function PathwayCardDownload({
  cardElementId,
  fileName = 'pathway-card',
  accentColor = '#ff7e40',
  size = 'md',
  style,
  fontFamily = "'DM Mono', monospace",
}: PathwayCardDownloadProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<'preview' | 'download' | null>(null);

  const padding = size === 'sm' ? '9px 16px' : '11px 22px';
  const fontSize = size === 'sm' ? '10px' : '11px';

  const captureCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const el = document.getElementById(cardElementId);
    if (!el) {
      console.error('[PathwayCardDownload] Element #' + cardElementId + ' not found.');
      return null;
    }
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#f2f6ff',
      scale: 2,
      logging: false,
    });
    return canvas;
  }, [cardElementId]);

  const handlePreview = useCallback(async () => {
    setLoading('preview');
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      setPreviewDataUrl(canvas.toDataURL('image/png'));
      setPreviewOpen(true);
    } catch (err) {
      console.error('[PathwayCardDownload] Preview error:', err);
    } finally {
      setLoading(null);
    }
  }, [captureCard]);

  const handleDownload = useCallback(async () => {
    setLoading('download');
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const { jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const isLandscape = imgWidth > imgHeight;
      const pageW = isLandscape ? 297 : 210;
      const pageH = isLandscape ? 210 : 297;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const margin = 10;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / imgWidth, maxH / imgHeight);
      const drawW = imgWidth * ratio;
      const drawH = imgHeight * ratio;
      const offsetX = margin + (maxW - drawW) / 2;
      const offsetY = margin + (maxH - drawH) / 2;
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
      pdf.save(fileName + '.pdf');
    } catch (err) {
      console.error('[PathwayCardDownload] Download error:', err);
    } finally {
      setLoading(null);
    }
  }, [captureCard, fileName]);

  const baseBtn: React.CSSProperties = {
    all: 'unset',
    cursor: loading ? 'wait' : 'pointer',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding,
    borderRadius: '8px',
    fontFamily,
    fontSize,
    letterSpacing: '.06em',
    fontWeight: 700,
    textTransform: 'uppercase',
    opacity: loading ? 0.65 : 1,
    userSelect: 'none',
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', ...style }}>
        <button
          id={'btn-preview-' + cardElementId}
          onClick={handlePreview}
          disabled={!!loading}
          style={{ ...baseBtn, background: accentColor, color: '#fff', boxShadow: '0 4px 14px -4px ' + accentColor + '88' }}
        >
          {loading === 'preview' ? (
            <><span style={{ display: 'inline-block', width: '11px', height: '11px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pcd-spin .7s linear infinite' }} />PREVIEWING...</>
          ) : <>&#128065; PREVIEW CARD</>}
        </button>

        <button
          id={'btn-download-' + cardElementId}
          onClick={handleDownload}
          disabled={!!loading}
          style={{ ...baseBtn, background: '#1c1526', color: '#FDDD9A', boxShadow: '0 4px 14px -4px rgba(28,21,38,.5)' }}
        >
          {loading === 'download' ? (
            <><span style={{ display: 'inline-block', width: '11px', height: '11px', border: '2px solid rgba(253,221,154,.3)', borderTopColor: '#FDDD9A', borderRadius: '50%', animation: 'pcd-spin .7s linear infinite' }} />SAVING PDF...</>
          ) : <>&#11015; DOWNLOAD PDF</>}
        </button>
      </div>

      <style>{`@keyframes pcd-spin { to { transform: rotate(360deg); } } @keyframes pcd-fadein { from { opacity: 0; } to { opacity: 1; } }`}</style>

      {previewOpen && previewDataUrl && (
        <div
          id={'preview-modal-' + cardElementId}
          onClick={() => setPreviewOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(10,8,20,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'pcd-fadein .2s ease' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: 'min(860px,94vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,.6)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', background: '#1c1526', flexShrink: 0 }}>
              <span style={{ fontFamily, fontSize: '10px', color: '#FDDD9A', letterSpacing: '.08em', fontWeight: 700 }}>&#128065; CARD PREVIEW</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  id={'btn-modal-download-' + cardElementId}
                  onClick={handleDownload}
                  disabled={!!loading}
                  style={{ all: 'unset', cursor: loading ? 'wait' : 'pointer', boxSizing: 'border-box', padding: '7px 14px', background: accentColor, color: '#fff', borderRadius: '7px', fontFamily, fontSize: '9px', fontWeight: 700, letterSpacing: '.06em', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  {loading === 'download' ? '...' : String.fromCharCode(11015) + ' DOWNLOAD'}
                </button>
                <button
                  id={'btn-modal-close-' + cardElementId}
                  onClick={() => setPreviewOpen(false)}
                  style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.08)', borderRadius: '7px', color: '#fff', fontSize: '14px' }}
                >
                  &times;
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', background: '#0a0814', padding: '16px' }}>
              <img src={previewDataUrl} alt="Pathway card preview" style={{ width: '100%', display: 'block', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }} />
            </div>
            <div style={{ padding: '10px 16px', background: '#1c1526', flexShrink: 0, fontFamily, fontSize: '9px', color: 'rgba(253,221,154,.5)', letterSpacing: '.06em' }}>
              CLICK OUTSIDE OR X TO CLOSE  ·  DOWNLOAD TO SAVE AS PDF
            </div>
          </div>
        </div>
      )}
    </>
  );
}
