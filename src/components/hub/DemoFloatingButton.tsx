import React from 'react';
import { PlayCircle } from 'lucide-react';

interface DemoFloatingButtonProps {
  onClick: () => void;
  isBouncing?: boolean;
}

export default function DemoFloatingButton({ onClick, isBouncing = true }: DemoFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-[90] flex items-center justify-center gap-2 px-5 h-[46px] bg-[#f0c05a] hover:bg-[#f5cf7a] rounded-full shadow-[0_5px_20px_rgba(240,192,90,0.5)] transition-all group border-2 border-white/20 ${isBouncing ? 'animate-bounce' : ''}`}
      title="Watch Demo"
    >
      <PlayCircle size={22} className="text-[#1a150e] group-hover:scale-110 transition-transform" />
      <span className="font-bold text-[14px] text-[#1a150e] uppercase tracking-wider pr-1">Watch Demo</span>
    </button>
  );
}
