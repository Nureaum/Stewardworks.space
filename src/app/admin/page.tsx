'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { Upload, Image as ImageIcon, RotateCcw, Lock, ChevronLeft, LogIn, Users } from 'lucide-react';
import Link from 'next/link';
import UserManagement from '@/components/admin/UserManagement';
import { useUser } from '@clerk/nextjs';

/** The admin email address that has access to the customization panel. */
const ADMIN_EMAIL = 'vaniibodasingu@gmail.com';

export default function AdminPage() {
  const { settings, updateSettings, resetSettings } = useAdmin();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [currentTab, setCurrentTab] = useState<'wallpaper' | 'users'>('wallpaper');

  useEffect(() => {
    async function checkAdminRole() {
      if (!isLoaded) return;
      
      if (!user) {
        setIsCheckingRole(false);
        return;
      }

      // Check email fallback first
      if (user.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
        setIsAdmin(true);
        setIsCheckingRole(false);
        return;
      }

      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;
          // Support both role_name and role fields in the profile table
          if (profile?.role_name === 'admin' || profile?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
      } finally {
        setIsCheckingRole(false);
      }
    }
    
    checkAdminRole();
  }, [isLoaded, user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'wallpaperUrl' | 'leftPosterUrl' | 'rightPosterUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings({ [key]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Loading state
  if (!isLoaded || (isLoaded && user && isCheckingRole)) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="font-bold text-gray-400">Loading...</p>
      </div>
    );
  }

  // Not logged in - show sign in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center font-exo px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-steward-gold/10 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="text-steward-gold" size={32} />
            </div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-widest">Client Access</h1>
            <p className="text-sm text-gray-400 mt-2 text-center">Sign in with your admin account to customize the Hub portal.</p>
          </div>

          <div className="flex justify-center mt-6">
            <Link href="/login" className="bg-steward-dark hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-steward-dark/20 transition-colors w-full text-center text-sm">
              Sign In
            </Link>
          </div>

          <Link href="/hub" className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-steward-dark transition-colors">
            <ChevronLeft size={14} /> Back to Hub
          </Link>
        </div>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center font-exo px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-widest">Access Denied</h1>
            <p className="text-sm text-gray-400 mt-2">You are not authorized to access the admin panel.</p>
          </div>
          <Link href="/hub" className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-steward-dark transition-colors">
            <ChevronLeft size={14} /> Back to Hub
          </Link>
        </div>
      </div>
    );
  }

  // Admin panel
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5] font-exo">
      {/* Left Sidebar */}
      <aside className="w-64 bg-steward-dark text-white flex flex-col shrink-0 shadow-2xl z-10">
        <div className="p-6 border-b border-white/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-steward-gold/20 rounded-xl flex items-center justify-center mb-3">
            <Lock className="text-steward-gold" size={24} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Steward.Works</h2>
          <p className="text-[10px] text-steward-gold font-bold uppercase tracking-widest mt-1">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setCurrentTab('wallpaper')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all border shadow-inner ${currentTab === 'wallpaper' ? 'bg-white/10 text-white border-white/5' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'}`}
          >
            <ImageIcon size={18} className={currentTab === 'wallpaper' ? 'text-steward-gold' : 'text-gray-400'} />
            Wallpaper / Posters
          </button>
          
          <button 
            onClick={() => setCurrentTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all border shadow-inner ${currentTab === 'users' ? 'bg-white/10 text-white border-white/5' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'}`}
          >
            <Users size={18} className={currentTab === 'users' ? 'text-steward-gold' : 'text-gray-400'} />
            User Management
          </button>
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-black/20">
          <Link href="/hub" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-steward-gold text-steward-dark rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 transition-colors shadow-lg">
            <ChevronLeft size={16} /> Back to Hub
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F9FA]">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-100 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm z-0">
          <div>
            <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tighter">Hub Customization</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Room Aesthetics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Editing
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            {currentTab === 'wallpaper' && (
              <>
            {/* Wallpaper Customization */}
            <section className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <ImageIcon className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-steward-dark uppercase tracking-tight">Main Wallpaper</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Background of the Hub room</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div 
                  className="aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden relative group"
                  style={{ backgroundImage: settings.wallpaperUrl ? `url(${settings.wallpaperUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {!settings.wallpaperUrl && <p className="text-[10px] font-black text-gray-300 uppercase">Current: Default Gray</p>}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'wallpaperUrl')} />
                    <div className="bg-white text-steward-dark px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">Replace Image</div>
                  </label>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <p className="text-sm text-gray-500 leading-relaxed italic bg-gray-50 p-4 rounded-xl border border-gray-100">
                    Upload a high-resolution image (recommended 1920x1080) to change the background environment. This applies instantly to the Hub.
                  </p>
                  <button 
                    onClick={() => updateSettings({ wallpaperUrl: null })}
                    className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 hover:bg-red-50 w-fit px-4 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw size={14} /> Reset to Default
                  </button>
                </div>
              </div>
            </section>

            {/* Poster Customization */}
            <section className="grid md:grid-cols-2 gap-8">
              {/* Left Poster */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                    <Upload size={16} />
                  </div>
                  <h3 className="text-lg font-black text-steward-dark uppercase tracking-tight">Left Wall Poster</h3>
                </div>
                
                <div 
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 bg-[#F4ECD8] mb-6 flex items-center justify-center overflow-hidden relative group w-full max-w-[240px] mx-auto shadow-inner"
                  style={{ backgroundImage: settings.leftPosterUrl ? `url(${settings.leftPosterUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {!settings.leftPosterUrl && <p className="text-[10px] font-black text-gray-400 uppercase text-center px-4">Current: Geological Map</p>}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'leftPosterUrl')} />
                    <div className="bg-white text-steward-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">Upload</div>
                  </label>
                </div>
                
                <div className="mt-auto flex justify-center">
                  <button 
                    onClick={() => updateSettings({ leftPosterUrl: null })}
                    className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw size={14} /> Reset Poster
                  </button>
                </div>
              </div>

              {/* Right Poster */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 transition-all hover:shadow-2xl flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                    <Upload size={16} />
                  </div>
                  <h3 className="text-lg font-black text-steward-dark uppercase tracking-tight">Right Wall Poster</h3>
                </div>
                
                <div 
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 bg-[#2D1B0D] mb-6 flex items-center justify-center overflow-hidden relative group w-full max-w-[240px] mx-auto shadow-inner"
                  style={{ backgroundImage: settings.rightPosterUrl ? `url(${settings.rightPosterUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  {!settings.rightPosterUrl && <p className="text-[10px] font-black text-white/40 uppercase text-center px-4">Current: Movie Poster</p>}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'rightPosterUrl')} />
                    <div className="bg-white text-steward-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">Upload</div>
                  </label>
                </div>
                
                <div className="mt-auto flex justify-center">
                  <button 
                    onClick={() => updateSettings({ rightPosterUrl: null })}
                    className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcw size={14} /> Reset Poster
                  </button>
                </div>
              </div>
            </section>

            {/* Global Reset */}
            <div className="pt-8 pb-12 flex justify-center">
              <button 
                onClick={resetSettings}
                className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-red-50 hover:border-red-200 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <RotateCcw size={16} /> Reset All Customizations
              </button>
            </div>
              </>
            )}
            
            {currentTab === 'users' && <UserManagement isMainAdmin={user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL} />}
          </div>
        </main>
      </div>
    </div>
  );
}
