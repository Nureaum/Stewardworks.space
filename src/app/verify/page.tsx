'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loaded, client, handleEmailLinkVerification, setActive } = useClerk();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'mismatch'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!loaded) return;

    const clerkStatus = searchParams.get('__clerk_status');
    const ticket = searchParams.get('__clerk_ticket');
    const createdSessionId = searchParams.get('__clerk_created_session');
    const flowType = searchParams.get('type');
    const targetUrl = flowType === 'signup' ? '/hub/my-profile' : '/hub';

    if (clerkStatus === 'client_mismatch') {
      setStatus('mismatch');
      return;
    }
    
    if (clerkStatus === 'expired') {
      setStatus('failed');
      setErrorMsg('This magic link has expired. Please request a new one.');
      return;
    }

    if (ticket) {
      handleEmailLinkVerification({
        redirectUrl: targetUrl,
        redirectUrlComplete: targetUrl,
      }).catch((err) => {
        console.error(err);
        setStatus('failed');
        setErrorMsg('Verification failed. The link might be invalid or expired.');
      });
    } else if (clerkStatus === 'verified' && createdSessionId) {
      // Magic link verified on a different browser, need to set the active session
      setActive({ session: createdSessionId }).then(() => {
        setStatus('success');
        setTimeout(() => window.location.href = targetUrl, 1500);
      }).catch((err) => {
        console.error(err);
        setStatus('failed');
        setErrorMsg('Failed to activate session.');
      });
    } else {
      // If there's no ticket and no error, maybe they are already logged in
      if (client.activeSessions && client.activeSessions.length > 0) {
        setStatus('success');
        setTimeout(() => window.location.href = targetUrl, 1500);
      } else {
        setStatus('failed');
        setErrorMsg('Invalid verification link.');
      }
    }
  }, [loaded, searchParams, handleEmailLinkVerification, client, router]);

  return (
    <div className="min-h-screen bg-steward-offwhite flex flex-col items-center justify-center font-exo p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="animate-spin text-steward-blue" size={48} />
            <h1 className="text-xl font-black text-steward-dark uppercase tracking-tight">Verifying Link...</h1>
            <p className="text-sm text-steward-dark/60">Please wait while we securely log you in.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="text-steward-green" size={48} />
            <h1 className="text-xl font-black text-steward-dark uppercase tracking-tight">Success!</h1>
            <p className="text-sm text-steward-dark/60">You are securely logged in. Redirecting...</p>
          </div>
        )}

        {status === 'mismatch' && (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="text-yellow-500" size={48} />
            <h1 className="text-xl font-black text-steward-dark uppercase tracking-tight">Device Mismatch</h1>
            <p className="text-sm text-steward-dark/80">
              For security, Clerk requires magic links to be opened on the exact same device and browser where they were requested.
            </p>
            <p className="text-xs text-gray-400 mt-2 p-4 bg-gray-50 rounded-xl">
              <strong>Admin Note:</strong> If you want users to be able to open links on different devices (like requesting on laptop, clicking on phone), you must disable the <em>"Require same device and browser"</em> setting in your Clerk Dashboard under <strong>User & Authentication {'>'} Email, Phone, Username</strong>.
            </p>
            <Link href="/login" className="w-full mt-4 bg-steward-dark hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-steward-dark/20 transition-colors">
              Return to Login
            </Link>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="text-red-500" size={48} />
            <h1 className="text-xl font-black text-steward-dark uppercase tracking-tight">Verification Failed</h1>
            <p className="text-sm text-steward-dark/80">{errorMsg}</p>
            <Link href="/login" className="w-full mt-4 bg-steward-dark hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-steward-dark/20 transition-colors">
              Return to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-steward-offwhite flex items-center justify-center"><Loader2 className="w-8 h-8 text-steward-blue animate-spin" /></div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
