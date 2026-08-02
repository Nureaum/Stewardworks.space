'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AgreementsPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  const [termsError, setTermsError] = useState('');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch('/api/agreements');
        const data = await res.json();
        if (data.agreements) {
          const terms = data.agreements.find((a: any) => a.id === 'terms_of_participation');
          if (terms) {
            setContent(terms.content);
          } else {
            setContent('<p>No terms of participation found.</p>');
          }
        }
      } catch (err) {
        console.error('Failed to load terms:', err);
        setContent('<p>Error loading terms. Please try again later.</p>');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTerms();
  }, []);

  // Track scroll position in terms content
  useEffect(() => {
    const el = termsScrollRef.current;
    if (!el || isLoading) return;
    const handleScroll = () => {
      const threshold = 50;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
        setHasScrolledToBottom(true);
      }
    };
    el.addEventListener('scroll', handleScroll);
    
    // Slight delay to allow layout to compute
    setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight) {
        setHasScrolledToBottom(true);
      }
    }, 100);
    
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isLoading, content]);

  const handleAcceptTerms = () => {
    if (!termsAccepted) {
      setTermsError('You must check the box to accept the terms.');
      return;
    }
    if (!signature.trim()) {
      setTermsError('Please type your full name as your signature.');
      return;
    }
    setTermsError('');
    sessionStorage.setItem('terms_signature', signature.trim());
    sessionStorage.setItem('terms_accepted_at', new Date().toISOString());
    router.push('/signup?termsAccepted=true');
  };

  return (
    <div className="min-h-screen bg-steward-offwhite flex flex-col items-center justify-center font-exo p-4 py-8 relative z-10">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-steward-dark px-6 md:px-8 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-steward-blue rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            SW
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Site Notice &amp; Terms of Participation
            </h1>
            <p className="text-xs text-white/60 mt-0.5">
              Please read and accept before creating your account
            </p>
          </div>
        </div>

        {/* Terms Content - Scrollable */}
        <div
          ref={termsScrollRef}
          className="px-6 md:px-10 py-8 overflow-y-auto max-h-[50vh] border-b border-gray-100"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-steward-blue mb-4" />
              <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Loading terms...</p>
            </div>
          ) : (
            <div 
              className="space-y-8 text-left prose max-w-none text-sm leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          )}
        </div>

        {/* Scroll indicator */}
        {!hasScrolledToBottom && !isLoading && (
          <div className="flex items-center justify-center py-2 bg-steward-blue/5 border-b border-gray-100">
            <ChevronDown size={16} className="text-steward-blue animate-bounce mr-1" />
            <span className="text-xs text-steward-blue font-medium">Scroll down to read the full terms</span>
          </div>
        )}

        {/* Acceptance Area */}
        <div className="px-6 md:px-10 py-6 bg-gray-50/50 space-y-5">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (termsError) setTermsError('');
              }}
              className="mt-0.5 w-5 h-5 rounded border-2 border-steward-blue text-steward-blue focus:ring-steward-blue/30 cursor-pointer flex-shrink-0"
            />
            <span className="text-sm font-medium text-steward-dark leading-snug group-hover:text-steward-blue transition-colors">
              I have read and accept the StewardWorks Site Notice &amp; Terms of Participation.
            </span>
          </label>

          {/* Signature */}
          <div>
            <label className="block text-xs font-bold text-steward-dark/60 uppercase tracking-wider mb-2">
              Signature (type your full name)
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                if (termsError) setTermsError('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-white border-2 border-dashed border-steward-blue/30 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-medium text-steward-dark placeholder:text-gray-400 text-sm"
              placeholder="Type your full name here..."
            />
          </div>

          {/* Error */}
          {termsError && (
            <p className="text-red-500 text-xs font-bold">{termsError}</p>
          )}

          {/* Button */}
          <button
            onClick={handleAcceptTerms}
            disabled={!hasScrolledToBottom || isLoading}
            className="w-full bg-steward-blue text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-steward-orange transition-colors shadow-lg shadow-steward-blue/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-steward-blue"
          >
            Accept &amp; Continue to Sign Up
          </button>

          {!hasScrolledToBottom && !isLoading && (
            <p className="text-center text-xs text-steward-dark/50">
              Please scroll through the entire terms to continue
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-10 py-4 bg-white border-t border-gray-100 text-center">
          <p className="text-xs text-steward-dark/50">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-steward-blue hover:text-steward-orange transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
