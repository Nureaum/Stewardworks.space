'use client';

import React, { useState, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import CozyHubRoom from '@/components/hub/CozyHubRoom';

export default function HubPage() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [chiaProgress, setChiaProgress] = useState(0);

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded) return;
      if (!user) {
        setIsProfileLoaded(true);
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
          if (profile?.role === 'guest') {
            setIsGuest(true);
          }
          if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        }

        // Fetch workshop progress to calculate chia growth
        const progressRes = await fetch('/api/workshops/progress');
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          
          // Calculate chia progress EXACTLY as Portfolio component does
          const approvedDeliverables = progressData.progressRows?.filter(
            (p: any) => p.deliverable_status === 'approved'
          ).length || 0;
          
          const delivPct = Math.min(approvedDeliverables * 25, 75);
          
          // Engagement calculation - EXACT same values as Portfolio
          const ENGPCT: Record<string, number> = {
            bookmark: 1,
            note: 1,
            generation: 2,
            prompt: 3,
          };
          
          const engPct = Math.min(
            (progressData.engagements || [])
              .filter((e: any) => e.status === 'approved')
              .reduce((a: number, e: any) => a + (ENGPCT[e.kind] || 0), 0),
            25,
          );
          
          const totalProgress = Math.min(delivPct + engPct, 100);
          setChiaProgress(totalProgress);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsProfileLoaded(true);
      }
    }
    fetchProfile();
  }, [isLoaded, user]);

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isLoaded || !isProfileLoaded) {
    return (
      <div style={{width:'100vw',height:'100vh',background:'#21282E',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
         <div style={{width:'32px',height:'32px',border:'3px solid rgba(253,221,154,.2)',borderTopColor:'#FDDD9A',borderRadius:'50%',animation:'sw-spin 1s linear infinite'}}></div>
         <div style={{fontFamily:"'DM Mono', monospace", color:'#FDDD9A', letterSpacing:'.1em',fontSize:'12px'}}>Loading Hub...</div>
         <style>{`@keyframes sw-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <CozyHubRoom 
      isAdmin={isAdmin} 
      isGuest={isGuest} 
      avatarUrl={avatarUrl} 
      onLogout={handleLogout}
      initialChiaProgress={chiaProgress}
    />
  );
}
