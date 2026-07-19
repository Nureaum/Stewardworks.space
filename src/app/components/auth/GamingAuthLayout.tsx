"use client";

import FantasyBackground from "@/app/components/auth/FantasyBackground";
import OrnateBorder from "@/app/components/auth/OrnateBorder";

interface GamingAuthLayoutProps {
  children: React.ReactNode;
}

export default function GamingAuthLayout({ children }: GamingAuthLayoutProps) {
  return (
    <div className="relative min-h-screen font-exo overflow-y-auto">
      <FantasyBackground />
      <OrnateBorder />
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center py-8 px-4" style={{ marginBottom: 96 }}>
        {children}
      </div>
    </div>
  );
}
