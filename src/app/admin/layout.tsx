'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, ChevronLeft, Image as ImageIcon, Users, BookOpen, Layers, Map, MessageSquare, Beaker, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { AdminLoadingProvider } from '@/context/AdminLoadingContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      if (!isLoaded) return;
      
      if (!user) {
        setIsCheckingRole(false);
        return;
      }

      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;
          if (profile?.role === 'admin' || profile?.role === 'super_admin') {
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

  // Loading state
  if (!isLoaded || (isLoaded && user && isCheckingRole)) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin"></div>
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
            <p className="text-sm text-gray-400 mt-2 text-center">Sign in with your admin account to access the portal.</p>
          </div>

          <div className="flex justify-center mt-6">
            <Link href="/login?redirect_url=/admin" className="bg-steward-dark hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-steward-dark/20 transition-colors w-full text-center text-sm">
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

  const menuItems = [
    { label: 'Wallpaper / Posters', href: '/admin', icon: ImageIcon, exact: true },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Library Resources', href: '/admin/library', icon: BookOpen, exact: true },
    // { label: 'Manage Categories', href: '/admin/library/categories', icon: Layers }, // Hidden for now
    { label: 'Environmental Literacy', href: '/admin/environmental', icon: BookOpen, exact: false },
    { label: 'Community Sessions', href: '/admin/community-listening', icon: Users, exact: false },
    { label: 'Help Desk', href: '/admin/helpdesk', icon: MessageSquare, exact: false },
  ];

  const programItems = [
    { label: 'Workforce Pathways', href: '/admin/workforce-pathways', icon: Map, exact: false },
    { label: 'Pilot Workshops', href: '/admin/pilot-workshops', icon: Layers, exact: false },
    { label: 'AI Labs', href: '/admin/ai-labs', icon: Beaker, exact: false },
  ];

  const isProgramsActive = programItems.some(item => 
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5] font-exo">
      {/* Left Sidebar */}
      <aside className="w-64 bg-steward-dark text-white flex flex-col shrink-0 shadow-2xl z-20 relative">
        <div className="p-6 border-b border-white/10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-steward-gold/20 rounded-xl flex items-center justify-center mb-3">
            <Lock className="text-steward-gold" size={24} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Steward.Works</h2>
          <p className="text-[10px] text-steward-gold font-bold uppercase tracking-widest mt-1">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
              
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all border shadow-inner ${
                  isActive 
                    ? 'bg-white/10 text-white border-white/5' 
                    : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-steward-gold' : 'text-gray-400'} />
                {item.label}
              </Link>
            );
          })}
          
          {/* Programs Dropdown */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => setIsProgramsOpen(!isProgramsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all border shadow-inner ${
                isProgramsActive
                  ? 'bg-white/5 text-white border-white/5'
                  : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers size={18} className={isProgramsActive ? 'text-steward-gold' : 'text-gray-400'} />
                Programs
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isProgramsOpen ? 'rotate-180' : ''} ${isProgramsActive ? 'text-steward-gold' : 'text-gray-400'}`} 
              />
            </button>
            
            {isProgramsOpen && (
              <div className="flex flex-col space-y-1 pl-4 pt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                {programItems.map((item) => {
                  const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);
                    
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all border shadow-inner ${
                        isActive 
                          ? 'bg-white/10 text-white border-white/5' 
                          : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-steward-gold' : 'text-gray-400'} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        
        <div className="p-4 border-t border-white/10 bg-black/20">
          <Link href="/hub" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-steward-gold text-steward-dark rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-yellow-400 transition-colors shadow-lg">
            <ChevronLeft size={16} /> Back to Hub
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8F9FA] relative z-10">
        <AdminLoadingProvider>
          {children}
        </AdminLoadingProvider>
      </div>
    </div>
  );
}
