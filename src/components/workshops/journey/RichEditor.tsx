import React, { useRef, useEffect } from 'react';

interface RichEditorProps {
  value: string;
  onBlur: (value: string) => void;
  minHeight?: number | string;
  accent?: string;
}

export default function RichEditor({ value, onBlur, minHeight = 120, accent = '#45d6ff' }: RichEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(value);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (ref.current && !isInitialized.current) {
      ref.current.innerHTML = value;
      lastHtml.current = value;
      isInitialized.current = true;
    } else if (ref.current && value !== lastHtml.current) {
      // Only update if the parent explicitly passed a new value (e.g. switching selected entries)
      if (value !== ref.current.innerHTML) {
        ref.current.innerHTML = value;
      }
      lastHtml.current = value;
    }
  }, [value]);

  const emit = () => {
    if (onBlur && ref.current) {
      const currentHtml = ref.current.innerHTML;
      if (currentHtml !== lastHtml.current) {
        lastHtml.current = currentHtml;
        onBlur(currentHtml);
      }
    }
  };

  const cmd = (c: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (ref.current) ref.current.focus();
    document.execCommand(c, false, undefined);
    emit();
  };

  const link = (e: React.MouseEvent) => {
    e.preventDefault();
    if (ref.current) ref.current.focus();
    const u = window.prompt('Link URL:', 'https://');
    if (u) {
      document.execCommand('createLink', false, u);
      emit();
    }
  };

  const clip = (e: React.MouseEvent) => {
    e.preventDefault();
    if (ref.current) ref.current.focus();
    document.execCommand('removeFormat', false, undefined);
    emit();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  };

  const btnStyle = {
    fontFamily: "'Press Start 2P'",
    fontSize: '8px',
    cursor: 'pointer',
    color: accent,
    background: 'transparent',
    border: `2px solid ${accent}`,
    borderRadius: '4px',
    padding: '7px 9px',
    lineHeight: 1
  };

  return (
    <div style={{ border: '2px solid #3d2668', borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,.4)' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 8, borderBottom: '2px solid #3d2668', background: 'rgba(0,0,0,.35)' }}>
        <button type="button" style={{ ...btnStyle, fontWeight: 'bold' }} title="Bold" onMouseDown={e => cmd('bold', e)}>B</button>
        <button type="button" style={{ ...btnStyle, fontStyle: 'italic' }} title="Italic" onMouseDown={e => cmd('italic', e)}>I</button>
        <button type="button" style={{ ...btnStyle, textDecoration: 'underline' }} title="Underline" onMouseDown={e => cmd('underline', e)}>U</button>
        <button type="button" style={{ ...btnStyle }} title="Bulleted list" onMouseDown={e => cmd('insertUnorderedList', e)}>• LIST</button>
        <button type="button" style={{ ...btnStyle }} title="Numbered list" onMouseDown={e => cmd('insertOrderedList', e)}>1. LIST</button>
        <button type="button" style={{ ...btnStyle }} title="Insert link" onMouseDown={e => link(e)}>🔗 LINK</button>
        <button type="button" style={{ ...btnStyle, color: '#a493c9', borderColor: '#3d2668' }} title="Clear formatting" onMouseDown={e => clip(e)}>✕</button>
      </div>
      <style>{`
        .rich-editor-content ul {
          list-style-type: disc;
          padding-left: 2em;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .rich-editor-content ol {
          list-style-type: decimal;
          padding-left: 2em;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .rich-editor-content li {
          margin-bottom: 0.5em;
        }
      `}</style>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={emit}
        onPaste={handlePaste}
        className="rich-editor-content"
        style={{
          minHeight,
          padding: 12,
          color: '#efe6ff',
          fontSize: 18,
          lineHeight: 1.5,
          outline: 'none'
        }}
      />
    </div>
  );
}
