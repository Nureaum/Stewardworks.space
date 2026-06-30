'use client';

import React, { useState, useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import CozyHubRoom from '@/components/hub/CozyHubRoom';

export default function HubPage() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
          if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
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

  return (
    <CozyHubRoom isAdmin={isAdmin} avatarUrl={avatarUrl} onLogout={handleLogout} />
  );
}
