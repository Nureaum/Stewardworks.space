'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { 
  FileText, 
  UserCircle,
  Users,
  Cpu,
  HelpCircle,
  Mic,
  Presentation,
  Beaker,
  Palmtree,
  Map,
  Star,
  HelpingHand,
  Hammer,
  Wrench,
  Settings
} from 'lucide-react';
import Image from 'next/image';
import { useAdmin } from '@/context/AdminContext';
import { createClient } from '@/utils/supabase/client';

export default function HubPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { settings } = useAdmin();
  const [selectedTopic, setSelectedTopic] = useState<string>('getting-started');
  const [statusMessage, setStatusMessage] = useState('Exploring the environmental literacy hub...');
  const [currentTime, setCurrentTime] = useState<string>('');
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    // Set initial time on mount to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const topics = [
    { id: 'my-profile', title: 'My Profile', icon: <Star size={32} />, path: '/hub/my-profile', pos: 'top-[5%] left-1/2 -translate-x-1/2' },
    { id: 'workforce-pathways', title: 'Workforce Pathways', icon: <Map size={32} />, path: '/hub/workforce-pathways', pos: 'top-[22%] left-[20%]' },
    { id: 'help-desk', title: 'Help Desk', icon: <HelpingHand size={32} />, path: '/onboarding/bulletin', pos: 'top-[22%] right-[20%]' },
    { id: 'ai-lab', title: 'AI Lab', icon: <Beaker size={32} />, path: '/hub/ai-lab', pos: 'top-[42%] left-1/2 -translate-x-1/2' },
    { id: 'env-literacy', title: 'Environmental Literacy', icon: <Palmtree size={32} />, path: '/hub/environmental-literacy', pos: 'bottom-[25%] left-[15%]' },
    { id: 'pilot-workshops', title: 'Pilot Workshops', icon: <Hammer size={32} />, path: '/hub/pilot-workshops', pos: 'bottom-[25%] right-[15%]' },
    { id: 'listening-sessions', title: 'Community Listening Sessions', icon: <Users size={32} />, path: '/hub/community-listening', pos: 'bottom-[5%] left-1/2 -translate-x-1/2' },
  ];

  return (
    <div 
      className="laptop-frame-wrapper min-h-screen flex flex-col items-center justify-center overflow-hidden font-exo relative transition-all duration-1000"
      style={{ 
        backgroundColor: settings.wallpaperUrl ? 'transparent' : '#A0C4FF',
        backgroundImage: settings.wallpaperUrl ? `url(${settings.wallpaperUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Hidden Link to Admin (for clients) - Positioned subtly at the very bottom corner */}
      <Link href="/admin" className="absolute bottom-2 left-2 z-[100] opacity-0 hover:opacity-100 transition-opacity p-2 text-steward-dark/20 hover:text-steward-dark">
        <Settings size={16} />
      </Link>

      {/* 1. WALL ART: VINTAGE POSTERS (z-index: 1) */}
      {/* Left Poster: Topographic/Geological Map */}
      <div className="absolute top-[5%] left-[5%] w-[350px] h-[480px] border-[12px] border-[#3D2B1F] bg-[#F4ECD8] shadow-2xl z-1 flex flex-col overflow-hidden group">
        {settings.leftPosterUrl ? (
          <div className="relative w-full h-full">
            <Image src={settings.leftPosterUrl} alt="Custom Left Poster" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex-1 relative p-6 border border-[#D2B48C]/30 m-2">
            {/* Mock Map Lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8B4513 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="w-full h-full border border-[#8B4513]/20 rounded-full scale-[1.5] -translate-x-1/2 -translate-y-1/2 absolute top-0 left-0" />
            <div className="w-full h-full border border-[#8B4513]/20 rounded-full scale-[1.2] -translate-x-1/2 -translate-y-1/2 absolute top-0 left-0" />
            <div className="w-full h-full border border-[#8B4513]/20 rounded-full scale-[0.9] -translate-x-1/2 -translate-y-1/2 absolute top-0 left-0" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="h-[1px] bg-[#8B4513]/40 w-full mb-2" />
              <div className="text-[10px] font-bold text-[#8B4513]/60 uppercase tracking-widest text-center">Geological Survey · Plate IV</div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
      </div>
      {/* Right Poster: Botanical/Scientific Diagram */}
      <div className="absolute top-[5%] right-[5%] w-[380px] h-[520px] border-[12px] border-[#3D2B1F] bg-[#2D1B0D] shadow-2xl z-1 flex flex-col overflow-hidden group">
        {settings.rightPosterUrl ? (
          <div className="relative w-full h-full">
            <Image src={settings.rightPosterUrl} alt="Custom Right Poster" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
            {/* Sunset/Mountain Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF7F50] via-[#D2691E] to-[#2D1B0D] opacity-80" />
            
            {/* Mountain Silhouette */}
            <div className="absolute bottom-0 w-full h-1/2 bg-[#1A0F07] clip-path-mountain" style={{ clipPath: 'polygon(0% 100%, 20% 60%, 40% 85%, 60% 40%, 80% 75%, 100% 100%)' }} />

            {/* Abstract Center Shape (Map/Silhouette) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <div className="w-48 h-64 bg-black/40 blur-xl rounded-[40%_60%_70%_30%/40%_50%_60%_50%]" />
            </div>

            {/* Neon Sign Content */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="border-4 border-[#00FFFF]/40 px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.3),inset_0_0_20px_rgba(0,255,255,0.2)] bg-black/20 backdrop-blur-sm">
                <div className="text-[28px] font-black text-[#00FFFF] tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] leading-none mb-1">Exit</div>
                <div className="text-[20px] font-black text-[#FFD700] tracking-[0.1em] uppercase drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] leading-none">Steward.Works</div>
              </div>
              
              <div className="mt-6 flex flex-col items-center gap-1">
                <div className="text-[8px] font-bold text-white/60 tracking-[0.4em] uppercase">A Film By Curtis Brown</div>
                <div className="text-[10px] font-black text-white/80 tracking-[0.2em] uppercase">Coming Soon</div>
              </div>
            </div>
            
            {/* Reflection/Glow Effect */}
            <div className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* 2. FULL-WIDTH WOODEN DESK (z-index: 2) */}
      <div className="absolute bottom-0 w-full h-[250px] z-[2] shadow-[inset_0_15px_30px_rgba(0,0,0,0.2)] border-t-[6px] border-[#C1935F]" style={{ backgroundColor: '#D4A574' }}>
        {/* Wood Texture Detail */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(0,0,0,0.5) 13px)' }} />
      </div>

      {/* 3. LAPTOP CENTER (Sitting ON the desk, z-index: 3) */}
      <div className="laptop-outer-shell max-w-[900px] w-full absolute bottom-[-58px] md:bottom-[-70px] left-0 right-0 mx-auto z-[3] transition-all duration-500 drop-shadow-[0_25px_25px_rgba(0,0,0,0.5)] scale-[0.72] md:scale-[0.72] origin-bottom">
        {/* Upper Part: Screen */}
        <div className="laptop-bezel relative aspect-[16/9] flex flex-col rounded-t-3xl border-[10px] md:border-[20px] shadow-2xl overflow-hidden" style={{ borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' }}>
          <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-steward-dark opacity-30 uppercase tracking-[0.5em] z-30">
            StewardWorks Portable
          </div>
          
          <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
            {/* Blurred Logo Background */}
            <div className="absolute inset-0 z-0 opacity-[0.6] flex items-center justify-center p-12 md:p-24">
              <div className="relative w-full h-full">
                <Image 
                  src="/logo 1.jpg" 
                  alt="Background Logo" 
                  fill 
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </div>

            <div className="crt-overlay pointer-events-none" />
            
            <div className="w-full h-full flex flex-col relative z-10 overflow-hidden font-exo">
              {/* OS Header */}
              <div className="bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-steward-dark/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-[10px] text-steward-dark/40 font-black uppercase tracking-widest ml-2">StewardOS v2.0</span>
                </div>
                <div className="text-[10px] text-steward-dark/40 font-black uppercase tracking-tighter">
                  {currentTime}
                </div>
              </div>

              {/* Desktop Area with Icons in a Circle Arrangement */}
              <div className="flex-1 relative p-4 md:p-8">
                {topics.map((topic) => (
                  <Link 
                    key={topic.id} 
                    href={topic.path} 
                    className={`absolute ${topic.pos} group flex flex-col items-center gap-2 w-32 md:w-40 text-center z-20 transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className="bg-[#FFD700] w-14 h-14 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-steward-dark shadow-[0_8px_0_#D1AA4E,0_15px_20px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:scale-110 group-active:translate-y-1 group-active:shadow-none border-2 border-white/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
                      <div className="relative z-10 scale-90 md:scale-110">
                        {topic.icon}
                      </div>
                    </div>
                    <span className="text-[9px] md:text-[11px] font-black text-steward-dark uppercase tracking-tight leading-tight drop-shadow-sm bg-white/90 px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">
                      {topic.title}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Bottom Taskbar */}
              <div className="h-14 bg-white/60 backdrop-blur-md border-t border-steward-dark/5 mt-auto flex items-center px-8 justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 relative cursor-pointer hover:scale-110 transition-transform active:scale-95" onClick={() => router.push('/')}>
                    <Image src="/logo 1.jpg" alt="Logo" fill sizes="40px" className="object-contain rounded-md drop-shadow-sm" />
                  </div>
                  <div className="h-6 w-[1px] bg-steward-dark/10" />
                  <div className="text-[10px] text-steward-dark/30 font-black uppercase tracking-[0.2em] hidden md:block">
                    Stewardship Active
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Part: Keyboard and Base */}
        <div className="laptop-base-part relative pt-6 pb-10 md:pt-8 md:pb-16 rounded-b-3xl border-x-[10px] md:border-x-[20px] border-b-[10px] md:border-b-[20px] shadow-2xl flex flex-col items-center overflow-hidden" style={{ borderColor: '#E5E7EB', background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 100%)' }}>
          <div className="keyboard-grid max-w-2xl w-full px-8 md:px-12 grid grid-cols-10 gap-1 md:gap-2 mb-4 md:mb-6 opacity-60">
            {[
              "ESC", "Q", "W", "E", "R", "T", "Y", "U", "I", "PWR",
              "A", "S", "D", "F", "G", "H", "J", "K", "L", "ENT",
              "SHFT", "Z", "X", "C", "V", "B", "N", "M", ",", "SHFT",
              "CTRL", "OPT", "CMD", "SPACE", "SPACE", "SPACE", "SPACE", "CMD", "OPT", "CTRL"
            ].map((key, i) => (
              <div 
                key={i} 
                className={`h-4 md:h-8 rounded-md bg-[#FEFAE0] border-b-[3px] border-gray-300 shadow-md flex items-center justify-center text-[5px] md:text-[8px] font-black text-gray-500 hover:translate-y-[1px] transition-transform ${key === "SPACE" ? "col-span-1" : ""}`}
              >
                {key === "SPACE" ? "" : key}
              </div>
            ))}
          </div>
          <div className="w-40 h-2 bg-steward-dark/5 rounded-full" />
        </div>
      </div>

      {/* 4. FRONT DECORATIONS (z-index: 4) */}
      {/* LEFT SIDE: Art Deco Lamp */}
      <div className="absolute bottom-[250px] left-[5%] md:left-[10%] z-[4] flex items-end pointer-events-none">
        {/* Art Deco Table Lamp - Scaled up */}
        <div className="relative flex flex-col items-center">
          {/* Arched Dome */}
          <div className="w-48 h-32 bg-gradient-to-b from-pink-300/60 via-amber-200/50 to-amber-400/30 rounded-t-full shadow-[inset_0_10px_30px_rgba(255,255,255,0.6),0_0_60px_rgba(251,191,36,0.3)] border-b-4 border-amber-600/20 relative overflow-hidden flex items-center justify-center">
            {/* Inner Light Glow */}
            <div className="w-24 h-24 bg-white/40 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30" />
          </div>
          {/* Metallic Stem - Shorter */}
          <div className="w-3.5 h-[350px] bg-gradient-to-r from-amber-800 via-amber-500 to-amber-900 shadow-lg" />
          {/* Brass Base */}
          <div className="w-32 h-8 bg-gradient-to-r from-amber-950 via-amber-600 to-amber-950 rounded-t-2xl shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/30" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Books & Potted Cacti */}
      <div className="absolute bottom-[250px] right-[0px] md:right-[2%] z-[4] flex items-end gap-1 pointer-events-none">
        {/* Left Bookend (Floral Brass Wire) */}
        <div className="relative w-12 h-40 flex items-end justify-center mb-[-10px] mr-1">
          <div className="w-1 h-32 bg-amber-600 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
          <div className="w-8 h-8 border-2 border-amber-600 rounded-full absolute top-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-4 h-4 bg-amber-600 rounded-full blur-[2px] opacity-40" />
          </div>
          <div className="w-6 h-6 border-2 border-amber-600 rounded-full absolute top-20 left-0" />
          <div className="w-6 h-6 border-2 border-amber-600 rounded-full absolute top-20 right-0" />
          <div className="w-12 h-2 bg-amber-700 rounded-full" />
        </div>

        {/* Vintage Decorative Books */}
        <div className="flex items-end mb-[-10px]">
          {/* Red Book */}
          <div className="w-12 h-56 bg-[#8B0000] border-x-4 border-black/20 rounded-sm shadow-md flex flex-col items-center pt-6 space-y-4">
            <div className="w-3/4 h-[1px] bg-amber-500/40" />
            <div className="w-1/2 h-[1px] bg-amber-500/40" />
            <div className="flex-1" />
            <div className="w-3/4 h-[1px] bg-amber-500/40 mb-6" />
          </div>
          {/* Beige Book */}
          <div className="w-10 h-48 bg-[#F5F5DC] border-x-4 border-black/10 rounded-sm shadow-md flex flex-col items-center pt-4 space-y-2">
            <div className="w-full h-4 border-y border-black/5 flex flex-col gap-0.5 justify-center px-1">
              <div className="h-[0.5px] bg-black/10 w-full" />
              <div className="h-[0.5px] bg-black/10 w-full" />
            </div>
          </div>
          {/* Teal Book */}
          <div className="w-14 h-60 bg-[#008080] border-x-4 border-black/20 rounded-sm shadow-md flex flex-col items-center pt-8">
            <div className="w-8 h-8 rounded-full border border-white/20 mb-4 flex items-center justify-center">
              <div className="w-4 h-[1px] bg-white/20 rotate-45" />
              <div className="w-4 h-[1px] bg-white/20 -rotate-45" />
            </div>
            <div className="w-3/4 h-[1px] bg-white/10 mt-auto mb-10" />
          </div>
          {/* Orange Book */}
          <div className="w-9 h-52 bg-[#FF8C00] border-x-4 border-black/20 rounded-sm shadow-md flex flex-col items-center justify-between py-6">
            <div className="w-full h-[1px] bg-black/10" />
            <div className="w-full h-[1px] bg-black/10" />
            <div className="w-full h-[1px] bg-black/10" />
          </div>
          {/* Yellow Book */}
          <div className="w-11 h-44 bg-[#FFD700] border-x-4 border-black/10 rounded-sm shadow-md flex flex-col items-center pt-4">
            <div className="w-2 h-2 bg-black/5 rounded-full mb-2" />
            <div className="w-full h-[1px] bg-black/5" />
          </div>
          {/* Coral Book */}
          <div className="w-13 h-56 bg-[#FF7F50] border-x-4 border-black/20 rounded-sm shadow-md flex flex-col items-center py-8 space-y-1">
            <div className="w-full h-[0.5px] bg-white/20" />
            <div className="w-full h-[0.5px] bg-white/20" />
            <div className="w-full h-[0.5px] bg-white/20" />
          </div>
        </div>

        {/* Right Bookend (Floral Brass Wire) */}
        <div className="relative w-12 h-40 flex items-end justify-center mb-[-10px] ml-1">
          <div className="w-1 h-32 bg-amber-600 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
          <div className="w-8 h-8 border-2 border-amber-600 rounded-full absolute top-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-4 h-4 bg-amber-600 rounded-full blur-[2px] opacity-40" />
          </div>
          <div className="w-6 h-6 border-2 border-amber-600 rounded-full absolute top-20 left-0" />
          <div className="w-6 h-6 border-2 border-amber-600 rounded-full absolute top-20 right-0" />
          <div className="w-12 h-2 bg-amber-700 rounded-full" />
        </div>

        {/* Potted Cacti - Now behind the books (further from the laptop) */}
        <div className="flex items-end gap-6 mb-[-10px] ml-4">
          {/* Cactus 1 (Tall) */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-[300px] flex items-center justify-center">
              <div className="w-16 h-[280px] bg-[#6B8E23] rounded-full border-2 border-black/10 shadow-[inset_-6px_-6px_15px_rgba(0,0,0,0.2)] relative overflow-hidden">
                {/* Needles */}
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-0.5 h-2 bg-white/40 rounded-full"
                    style={{ 
                      top: `${Math.random() * 80 + 10}%`, 
                      left: `${Math.random() * 80 + 10}%`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }} 
                  />
                ))}
              </div>
            </div>
            {/* Terracotta Pot */}
            <div className="w-24 h-16 bg-[#A0522D] rounded-b-3xl border-t-[15px] border-[#8B4513] shadow-xl relative overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.2) 50%, transparent)' }} />
            </div>
          </div>

          {/* Cactus 2 (Short) */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-56 flex items-center justify-center">
              <div className="w-14 h-48 bg-[#8FBC8F] rounded-full border-2 border-black/10 shadow-[inset_-5px_-5px_12px_rgba(0,0,0,0.2)] relative overflow-hidden">
                {/* Needles */}
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-0.5 h-1.5 bg-white/30 rounded-full"
                    style={{ 
                      top: `${Math.random() * 80 + 10}%`, 
                      left: `${Math.random() * 80 + 10}%`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }} 
                  />
                ))}
              </div>
            </div>
            {/* Terracotta Pot */}
            <div className="w-20 h-14 bg-[#A0522D] rounded-b-2xl border-t-8 border-[#8B4513] shadow-lg relative">
              <div className="absolute inset-0 opacity-10 bg-black/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
