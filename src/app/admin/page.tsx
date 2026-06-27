'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import { Upload, Image as ImageIcon, RotateCcw, Lock, ChevronLeft, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

/** The admin email address that has access to the customization panel. */
const ADMIN_EMAIL = 'vaniibodasingu@gmail.com';

export default function AdminPage() {
  const { settings, updateSettings, resetSettings } = useAdmin();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const isAdmin = isLoaded && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

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
  if (!isLoaded) {
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
    <div className="min-h-screen bg-[#F5F5F5] font-exo pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-8 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-steward-dark uppercase tracking-tighter">Hub Customization</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Admin Control Panel</p>
          </div>
          <Link href="/hub" className="bg-steward-gold text-steward-dark px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-md">
            View Changes
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-12 px-6 space-y-8">
        {/* Wallpaper Customization */}
        <section className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-50">
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
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'wallpaperUrl')} />
                <div className="bg-white text-steward-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Replace</div>
              </label>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed italic">Upload a high-resolution image (recommended 1920x1080) to change the background environment.</p>
              <button 
                onClick={() => updateSettings({ wallpaperUrl: null })}
                className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600"
              >
                <RotateCcw size={14} /> Reset to Default
              </button>
            </div>
          </div>
        </section>

        {/* Poster Customization */}
        <section className="grid md:grid-cols-2 gap-8">
          {/* Left Poster */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-50">
            <h3 className="text-lg font-black text-steward-dark uppercase tracking-tight mb-6">Left Wall Poster</h3>
            <div 
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 bg-[#F4ECD8] mb-6 flex items-center justify-center overflow-hidden relative group"
              style={{ backgroundImage: settings.leftPosterUrl ? `url(${settings.leftPosterUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {!settings.leftPosterUrl && <p className="text-[10px] font-black text-gray-300 uppercase text-center px-4">Current: Geological Map</p>}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'leftPosterUrl')} />
                <div className="bg-white text-steward-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Upload Image</div>
              </label>
            </div>
            <button 
              onClick={() => updateSettings({ leftPosterUrl: null })}
              className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600"
            >
              <RotateCcw size={14} /> Reset to Default
            </button>
          </div>

          {/* Right Poster */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-50">
            <h3 className="text-lg font-black text-steward-dark uppercase tracking-tight mb-6">Right Wall Poster</h3>
            <div 
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 bg-[#2D1B0D] mb-6 flex items-center justify-center overflow-hidden relative group"
              style={{ backgroundImage: settings.rightPosterUrl ? `url(${settings.rightPosterUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {!settings.rightPosterUrl && <p className="text-[10px] font-black text-white/20 uppercase text-center px-4">Current: Stewards.Works Movie Poster</p>}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'rightPosterUrl')} />
                <div className="bg-white text-steward-dark px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Upload Image</div>
              </label>
            </div>
            <button 
              onClick={() => updateSettings({ rightPosterUrl: null })}
              className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600"
            >
              <RotateCcw size={14} /> Reset to Default
            </button>
          </div>
        </section>

        {/* Global Reset */}
        <div className="pt-10 flex justify-center">
          <button 
            onClick={resetSettings}
            className="flex items-center gap-2 px-8 py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-colors shadow-lg shadow-red-500/5"
          >
            <RotateCcw size={18} /> Reset All Customizations
          </button>
        </div>
      </div>
    </div>
  );
}
