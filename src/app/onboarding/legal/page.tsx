'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Save } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

export default function LegalNotice() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const url = searchParams.get('returnUrl');
    setReturnUrl(url);
  }, [searchParams]);

  const handleSaveAndContinue = async (isContinue: boolean) => {
    setIsSaving(true);

    if (user && signature.trim()) {
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: signature.trim(),
          }),
        });
      } catch (error) {
        console.error('Save error:', error);
      }
    }

    setIsSaving(false);
    if (isContinue) {
      const url = returnUrl ? `/onboarding/objectives?returnUrl=${returnUrl}` : '/onboarding/objectives';
      router.push(url);
    } else {
      alert('Progress saved to Database!');
    }
  };

  const handleAttemptContinue = () => {
    if (!signature.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    handleSaveAndContinue(true);
  };

  return (
    <main className="min-h-screen bg-steward-offwhite flex flex-col relative z-10 font-exo">
      {/* Header - Matching Page 2 Dark Theme */}
      <header className="bg-steward-dark px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
        {/* 1. Logo (SW blue circle, link to pg 5) */}
        <div 
          className="w-10 h-10 bg-steward-blue rounded-full flex items-center justify-center font-black text-white text-sm cursor-pointer hover:scale-105 transition-transform" 
          onClick={() => router.push('/hub')}
        >
          SW
        </div>
        
        {/* 2. Title Text (Legal Notice, center top) */}
        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
          Legal Notice
        </h1>
        
        {/* 3. Button (Save Progress, top right) */}
        <button 
          onClick={() => handleSaveAndContinue(false)}
          disabled={isSaving}
          className="bg-steward-green hover:bg-steward-orange text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Progress'}
        </button>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-8 py-10 px-6 pb-32">
        
        {/* 1. Text Content Area - Based on Terms of Use & Digital Creator Rights.jpg */}
        <div className="bg-white border border-steward-gold/20 rounded-xl p-8 md:p-12 shadow-sm font-exo text-steward-dark overflow-y-auto max-h-[60vh]">
          <h2 className="text-2xl font-bold mb-2">Terms of Use & Digital Creator Rights</h2>
          <p className="text-sm text-steward-gold mb-8 font-medium text-left">Effective Date: January 8, 2026</p>
          
          <div className="space-y-8 text-left">
            <section>
              <h3 className="text-lg font-bold text-steward-blue mb-3">1. Your Rights as a Digital Creator</h3>
              <p className="text-sm leading-relaxed mb-3">
                As a participant in the AI Content Creation & Environmental Literacy Hub, you retain ALL intellectual property rights to content you create. This includes:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 opacity-90 font-medium">
                <li>Written content, stories, and narratives you produce</li>
                <li>Visual content, images, and digital media you generate</li>
                <li>Bilingual translations and adaptations of your work</li>
                <li>Environmental storytelling projects and portfolios</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-steward-blue mb-3">2. California Creator Protections</h3>
              <p className="text-sm leading-relaxed mb-3">
                Under California law, including provisions aligned with the California Consumer Privacy Act (CCPA) and Digital Creator Rights, you have the right to:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 opacity-90 font-medium">
                <li>Own and control your creative work without assignment to this platform</li>
                <li>Decide how your work is used, shared, or displayed publicly</li>
                <li>Withdraw permission for use of your work at any time</li>
                <li>Be credited as the creator when your work is showcased</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-steward-blue mb-3">3. Platform Use of Student Work</h3>
              <p className="text-sm leading-relaxed mb-3">
                Stewardworks.space may request permission to showcase exemplary student work for educational and promotional purposes. We will:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 opacity-90 font-medium">
                <li>Always request your explicit written consent before sharing your work</li>
                <li>Provide full attribution crediting you as the creator</li>
                <li>Allow you to revoke permission at any time</li>
                <li>Never sell or monetize your work without a separate written agreement</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-steward-blue mb-3">4. Data Privacy & Educational Use</h3>
              <p className="text-sm leading-relaxed mb-3">
                Your personal information and educational data will be:
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 opacity-90 font-medium">
                <li>Stored securely and used only for educational purposes</li>
                <li>Protected under privacy policies compliant with California law</li>
                <li>Shared with educational partners only in aggregate, de-identified form</li>
                <li>Available to you upon request, with options to correct or delete</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Action Area - Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end pt-4">
          {/* 1. Signature Field (Bottom Left) */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-steward-gold/20 rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-bold text-steward-dark mb-6">
                I acknowledge that I have read and understand my rights
              </label>
              <div className="flex flex-col space-y-2">
                <span className="text-[10px] text-steward-gold uppercase font-bold tracking-wider">Signature / Name:</span>
                <input 
                  type="text" 
                  value={signature}
                  onChange={(e) => {
                    setSignature(e.target.value);
                    if (showError) setShowError(false);
                  }}
                  className={`w-full bg-transparent border-b-2 border-dashed py-2 focus:outline-none font-medium text-steward-dark font-exo transition-colors ${
                    showError ? 'border-red-500' : 'border-steward-blue'
                  }`}
                  placeholder="Type your name here..."
                />
                {showError && (
                  <span className="text-xs font-bold text-red-500 animate-pulse mt-1">
                    Please type your name to accept the terms.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Button (Continue, bottom right) */}
          <div className="flex justify-end">
            <button 
              disabled={isSaving}
              onClick={handleAttemptContinue}
              className={`w-full md:w-auto px-12 py-4 rounded-xl shadow-lg transition-all duration-300 font-bold text-lg uppercase tracking-widest bg-steward-blue hover:bg-steward-orange text-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
            >
              {isSaving ? 'Saving...' : 'I Accept & Continue'}
            </button>
          </div>
        </div>

        {/* Footer Support Text */}
        <p className="text-center text-[10px] text-steward-gold font-medium pt-4 pb-10">
          Questions about your rights? Contact: support@stewardworks.space
        </p>
      </div>
    </main>
  );
}
