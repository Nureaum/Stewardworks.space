'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const AdminLoadingContext = createContext({
  setIsLoading: (loading: boolean) => {},
});

export function AdminLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Optionally reset loading on pathname change just in case a page forgets to turn it off
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <AdminLoadingContext.Provider value={{ setIsLoading }}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-steward-blue border-t-transparent rounded-full animate-spin shadow-lg"></div>
        </div>
      )}
    </AdminLoadingContext.Provider>
  );
}

export const useAdminLoading = () => useContext(AdminLoadingContext);
