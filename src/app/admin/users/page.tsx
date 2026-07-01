'use client';

import React, { useState, useEffect } from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { useAdminLoading } from '@/context/AdminLoadingContext';

export default function UsersAdminPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { setIsLoading } = useAdminLoading();

  useEffect(() => {
    console.log("UsersAdminPage useEffect mounted");
    async function checkRole() {
      console.log("checkRole started");
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.role === 'super_admin') {
            setIsSuperAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking role:', error);
      }
    }
    
    checkRole();
  }, []);

  return (
    <div className="p-8 lg:p-12">
      <UserManagement isMainAdmin={isSuperAdmin} />
    </div>
  );
}
