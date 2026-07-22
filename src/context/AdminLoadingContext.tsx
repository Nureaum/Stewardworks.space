'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const AdminLoadingContext = createContext({
  setIsLoading: (loading: boolean) => {},
  isLoading: false,
});

export function AdminLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Reset loading on pathname change just in case a page forgets to turn it off
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <AdminLoadingContext.Provider value={{ setIsLoading, isLoading }}>
      {children}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-50 h-1 overflow-hidden">
          <div className="h-full bg-[#e2b54a] animate-[admin-progress_1.5s_ease-in-out_infinite] origin-left" />
          <style>{`@keyframes admin-progress { 0% { transform: scaleX(0); transform-origin: left; } 50% { transform: scaleX(1); transform-origin: left; } 50.1% { transform: scaleX(1); transform-origin: right; } 100% { transform: scaleX(0); transform-origin: right; } }`}</style>
        </div>
      )}
    </AdminLoadingContext.Provider>
  );
}

export const useAdminLoading = () => useContext(AdminLoadingContext);
