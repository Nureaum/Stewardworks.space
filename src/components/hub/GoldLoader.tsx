import React from 'react';

export default function GoldLoader({ text = 'ENTERING...' }: { text?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,20,15,0.85)', backdropFilter: 'blur(8px)', animation: 'sw-fadein 0.3s ease' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(253,221,154,0.2)', borderTopColor: '#FDDD9A', animation: 'spin 1s linear infinite' }}></div>
      <div style={{ marginTop: 24, color: '#FEFAE0', fontFamily: '"DM Mono", monospace', letterSpacing: '0.1em', fontSize: 14 }}>{text}</div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes sw-fadein { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
