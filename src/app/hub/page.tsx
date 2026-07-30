'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import CozyHubRoom from '@/components/hub/CozyHubRoom';
import DemoVideoOverlay from '@/components/hub/DemoVideoOverlay';
import DemoFloatingButton from '@/components/hub/DemoFloatingButton';
import type { CohortProgress, ProgressAPIResponse } from '@/app/api/workshops/progress/route';

export default function HubPage() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Multi-cohort progress state (Validates: Requirements 4.1, 4.4)
  const [chiaProgress, setChiaProgress] = useState(0);
  const [cohortProgress, setCohortProgress] = useState<CohortProgress[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [globalEngagement, setGlobalEngagement] = useState(0);

  // Demo Video state
  const [demoVideoUrl, setDemoVideoUrl] = useState<string>('');
  const [showDemoVideoOverlay, setShowDemoVideoOverlay] = useState(false);
  const [hasSeenDemo, setHasSeenDemo] = useState(false);

  // Fetch progress data for a specific cohort (or default to most recent)
  const fetchProgressData = useCallback(async (cohortId?: string) => {
    try {
      const url = cohortId 
        ? `/api/workshops/progress?cohort_id=${cohortId}`
        : '/api/workshops/progress';
      
      const progressRes = await fetch(url);
      if (progressRes.ok) {
        const progressData: ProgressAPIResponse = await progressRes.json();
        
        // Store multi-cohort data from enhanced API response
        setCohortProgress(progressData.cohortProgress);
        setSelectedCohortId(progressData.selectedCohortId);
        setGlobalEngagement(progressData.globalEngagement.percentage);
        
        // Use totalProgress from API (replaces manual chia calculation)
        setChiaProgress(progressData.totalProgress);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  }, []);

  // Callback for cohort change - re-fetches with new cohort_id parameter
  const handleCohortChange = useCallback(async (newCohortId: string) => {
    setSelectedCohortId(newCohortId);
    await fetchProgressData(newCohortId);
  }, [fetchProgressData]);

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded || !user) return;
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
          if (profile?.has_seen_demo) {
            setHasSeenDemo(true);
          }
        }

        // Fetch demo video setting
        const hcRes = await fetch('/api/homepage-content');
        if (hcRes.ok) {
          const hcData = await hcRes.json();
          if (hcData.demo_video_url) {
            setDemoVideoUrl(hcData.demo_video_url);
            // If they haven't seen the demo and a demo video exists, show it
            if (data?.profile && !data.profile.has_seen_demo) {
              setShowDemoVideoOverlay(true);
            }
          }
        }

        // Fetch workshop progress using enhanced multi-cohort API
        await fetchProgressData();
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
    fetchProfile();
  }, [isLoaded, user, fetchProgressData]);

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSkipDemo = async () => {
    setShowDemoVideoOverlay(false);
    if (!hasSeenDemo) {
      setHasSeenDemo(true);
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ has_seen_demo: true }),
        });
      } catch (error) {
        console.error('Failed to update has_seen_demo status', error);
      }
    }
  };

  // Only show loading on initial Clerk auth check — not on profile/progress fetch
  if (!isLoaded) {
    return (
      <div style={{width:'100vw',height:'100vh',background:'#21282E',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
         <div style={{width:'32px',height:'32px',border:'3px solid rgba(253,221,154,.2)',borderTopColor:'#FDDD9A',borderRadius:'50%',animation:'sw-spin 1s linear infinite'}}></div>
         <div style={{fontFamily:"'DM Mono', monospace", color:'#FDDD9A', letterSpacing:'.1em',fontSize:'12px'}}>Loading Hub...</div>
         <style>{`@keyframes sw-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <CozyHubRoom 
        isAdmin={isAdmin} 
        isGuest={isGuest} 
        avatarUrl={avatarUrl} 
        onLogout={handleLogout}
        initialChiaProgress={chiaProgress}
        // Multi-cohort support props
        cohortProgress={cohortProgress}
        globalEngagement={globalEngagement}
        selectedCohortId={selectedCohortId}
        onCohortChange={handleCohortChange}
      />

      {showDemoVideoOverlay && demoVideoUrl && (
        <DemoVideoOverlay 
          videoUrl={demoVideoUrl} 
          onSkip={handleSkipDemo} 
        />
      )}

      {!showDemoVideoOverlay && demoVideoUrl && (
        <DemoFloatingButton 
          onClick={() => setShowDemoVideoOverlay(true)} 
        />
      )}
    </>
  );
}
