import React from 'react';
import { PlayCircle } from 'lucide-react';

interface DemoFloatingButtonProps {
  onClick: () => void;
}

export default function DemoFloatingButton({ onClick }: DemoFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[90] flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#2a2218] to-[#150f08] border border-[#e2b54a]/30 rounded-full shadow-[0_0_15px_rgba(226,181,74,0.3)] hover:shadow-[0_0_25px_rgba(226,181,74,0.5)] transition-all animate-pulse group"
      title="Watch Demo"
    >
      <PlayCircle size={28} className="text-[#e2b54a] group-hover:scale-110 transition-transform" />
      
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full border border-[#e2b54a]/20 animate-ping" style={{ animationDuration: '3s' }}></div>
    </button>
  );
}
