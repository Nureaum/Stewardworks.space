import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminProvider } from "@/context/AdminContext";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Lit Hub | StewardWorks",
  description: "Roadmap to environmental careers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/login'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/signup'}
      signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/hub'}
      signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/hub/my-profile'}
    >
      <html lang="en">
        <body className="min-h-screen relative font-exo" suppressHydrationWarning>
          <LanguageProvider>
            <AdminProvider>
              {children}
            </AdminProvider>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
