import React from 'react';
import { X, PlayCircle } from 'lucide-react';

interface DemoVideoOverlayProps {
  videoUrl: string;
  onSkip: () => void;
}

export default function DemoVideoOverlay({ videoUrl, onSkip }: DemoVideoOverlayProps) {
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  let embedUrl = videoUrl;
  if (isYouTube) {
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    else if (videoUrl.includes('youtube.com/watch')) videoId = new URLSearchParams(videoUrl.split('?')[1] || '').get('v') || '';
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-[#1a1511] border border-[#785a32]/30 rounded-2xl w-full max-w-[900px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#785a32]/10">
          <div className="flex items-center gap-2 text-[#e2b54a]">
            <PlayCircle size={20} />
            <h3 className="font-bold text-lg tracking-widest">WELCOME TO STEWARD.WORKS</h3>
          </div>
          <button 
            onClick={onSkip}
            className="text-[#9c8d76] hover:text-[#e2b54a] transition-colors p-1"
            title="Close Demo"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Player */}
        <div className="w-full aspect-video bg-black flex items-center justify-center relative">
          {isYouTube ? (
            <iframe 
              src={embedUrl} 
              className="w-full h-full absolute inset-0 border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          ) : (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full max-h-[70vh] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#785a32]/10 flex justify-end bg-[#130f0c]">
          <button 
            onClick={onSkip}
            className="px-6 py-2 bg-transparent border border-[#785a32]/50 text-[#e2b54a] rounded-lg font-bold text-sm tracking-wider hover:bg-[#e2b54a]/10 transition-colors"
          >
            SKIP DEMO
          </button>
        </div>
      </div>
    </div>
  );
}
