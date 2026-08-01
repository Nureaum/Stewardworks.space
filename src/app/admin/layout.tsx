'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, ChevronLeft, Image as ImageIcon, Users, BookOpen, Layers, Map, MessageSquare, Beaker, ChevronDown, Megaphone, BarChart3, Heart } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { AdminLoadingProvider } from '@/context/AdminLoadingContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isProgramsOpen, setIsProgramsOpen] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (!isLoaded) return;
      
      if (!user) {
        setIsCheckingRole(false);
        return;
      }

      // Check sessionStorage cache first to avoid re-fetching on every navigation
      const cached = sessionStorage.getItem('admin_role');
      if (cached) {
        const { role, ts } = JSON.parse(cached);
        // Cache for 5 minutes
        if (Date.now() - ts < 5 * 60 * 1000) {
          if (role === 'admin' || role === 'super_admin') setIsAdmin(true);
          if (role === 'super_admin') setIsSuperAdmin(true);
          setIsCheckingRole(false);
          return;
        }
      }

      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profile;
          if (profile?.role === 'admin' || profile?.role === 'super_admin') {
            setIsAdmin(true);
            if (profile?.role === 'super_admin') {
              setIsSuperAdmin(true);
            }
          }
          // Cache the result
          sessionStorage.setItem('admin_role', JSON.stringify({ role: profile?.role, ts: Date.now() }));
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
    { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, exact: false },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Library Resources', href: '/admin/library', icon: BookOpen, exact: true },
    // { label: 'Manage Categories', href: '/admin/library/categories', icon: Layers }, // Hidden for now
    { label: 'Environmental Literacy', href: '/admin/environmental', icon: BookOpen, exact: false },
    { label: 'Community Sessions', href: '/admin/community-listening', icon: Users, exact: false },
    { label: 'Help Desk', href: '/admin/helpdesk', icon: MessageSquare, exact: false },
    { label: 'Wellness', href: '/admin/wellness', icon: Heart, exact: false },
  ];

  const programItems = [
    { label: 'Workforce Pathways', href: '/admin/workforce-pathways', icon: Map, exact: false },
    { label: 'Pilot Workshops', href: '/admin/pilot-workshops', icon: Layers, exact: false },
    { label: 'AI Labs', href: '/admin/ai-labs', icon: Beaker, exact: false },
    { label: 'User Progress', href: '/admin/user-progress', icon: BarChart3, exact: false },
  ];

  const isProgramsActive = programItems.some(item => 
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  if (pathname === '/admin/environmental' || pathname.startsWith('/admin/workforce-pathways') || pathname.startsWith('/admin/pilot-workshops')) {
    return (
      <AdminLoadingProvider>
        {children}
      </AdminLoadingProvider>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FBF4E1] bg-[radial-gradient(rgba(120,90,50,.06)_1px,transparent_1px)] bg-[size:22px_22px] font-exo">
      {/* Left Sidebar */}
      <aside className="w-[246px] h-screen shrink-0 z-20 relative flex flex-col bg-gradient-to-b from-[#201811] to-[#150f08] border-r border-[#e2b54a]/[0.14] pt-[22px] px-4 pb-4">
        <div className="flex flex-col items-center pt-[6px] pb-[22px] border-b border-white/[0.06] mb-4">
          <div className="w-[56px] h-[56px] rounded-[15px] bg-[#e2b54a]/[0.13] flex items-center justify-center mb-3">
            <Lock className="text-[#e2b54a]" size={26} />
          </div>
          <h2 className="font-[800] text-[20px] tracking-[0.02em] text-white">STEWARD.WORKS</h2>
          <p className="font-mono text-[9.5px] tracking-[0.28em] text-[#e2b54a] mt-[5px]">
            {isSuperAdmin ? 'SUPER ADMIN DASHBOARD' : 'ADMIN DASHBOARD'}
          </p>
        </div>
        
        <nav className="flex-1 flex flex-col gap-[3px] overflow-y-auto pr-[2px]">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
              
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`w-full flex items-center gap-3 px-[14px] py-[10px] rounded-[10px] font-bold text-[13.5px] transition-all border ${
                  isActive 
                    ? 'bg-[#2a2218] text-[#e2b54a] border-[#e2b54a]/20 shadow-sm' 
                    : 'bg-transparent text-[#9c8d76] border-transparent hover:bg-white/5 hover:text-[#d3c8b4]'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#e2b54a]' : 'text-[#9c8d76]'} />
                {item.label}
              </Link>
            );
          })}
          
          {/* Programs Dropdown */}
          <div className="flex flex-col space-y-[3px]">
            <button
              onClick={() => setIsProgramsOpen(!isProgramsOpen)}
              className={`w-full flex items-center justify-between px-[14px] py-[10px] rounded-[10px] font-bold text-[13.5px] transition-all border ${
                isProgramsActive
                  ? 'bg-[#2a2218] text-[#e2b54a] border-[#e2b54a]/20 shadow-sm'
                  : 'bg-transparent text-[#9c8d76] border-transparent hover:bg-white/5 hover:text-[#d3c8b4]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers size={18} className={isProgramsActive ? 'text-[#e2b54a]' : 'text-[#9c8d76]'} />
                Programs
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isProgramsOpen ? 'rotate-180' : ''} ${isProgramsActive ? 'text-[#e2b54a]' : 'text-[#9c8d76]'}`} 
              />
            </button>
            
            {isProgramsOpen && (
              <div className="flex flex-col gap-[2px] pl-[14px] my-[2px] border-l border-white/[0.07] ml-2 animate-in slide-in-from-top-2 fade-in duration-200">
                {programItems.map((item) => {
                  const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);
                    
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={`w-full flex items-center gap-3 px-[14px] py-[8px] rounded-[8px] font-bold text-[13px] transition-all ${
                        isActive 
                          ? 'bg-[#2a2218] text-[#e2b54a]' 
                          : 'bg-transparent text-[#9c8d76] hover:bg-white/5 hover:text-[#d3c8b4]'
                      }`}
                    >
                      <Icon size={15} className={isActive ? 'text-[#e2b54a]' : 'text-[#9c8d76]'} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        
        <Link href="/hub" className="mt-[14px] flex items-center justify-center gap-[8px] p-[13px] rounded-[12px] bg-gradient-to-b from-[#c8963e] to-[#a97a2c] text-[#211609] font-[800] text-[12.5px] tracking-[0.14em] no-underline shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-opacity hover:opacity-90">
          <ChevronLeft size={16} /> BACK TO HUB
        </Link>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent relative z-30">
        <AdminLoadingProvider>
          {children}
        </AdminLoadingProvider>
      </div>
    </div>
  );
}
