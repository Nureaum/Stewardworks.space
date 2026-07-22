export default function JourneyLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#06040c',
      color: '#efe6ff',
      fontFamily: "'Inter', sans-serif",
      gap: 20,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '3px solid rgba(69,214,255,0.2)',
        borderTopColor: '#45d6ff',
        animation: 'journey-spin 0.8s linear infinite',
      }} />
      <div className="font-pixel" style={{
        fontSize: 11,
        letterSpacing: '0.2em',
        color: '#45d6ff',
        opacity: 0.8,
      }}>
        ENTERING JOURNEY...
      </div>
      <style>{`@keyframes journey-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
