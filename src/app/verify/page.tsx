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
    const isInvitationFromUrl = searchParams.get('invitation') === 'true';
    // Also check sessionStorage as fallback (invitation flag may not be in URL)
    const isInvitationFromStorage = typeof window !== 'undefined' && sessionStorage.getItem('is_invitation') === 'true';
    const isInvitation = isInvitationFromUrl || isInvitationFromStorage;
    const targetUrl = flowType === 'signup' ? '/hub/my-profile' : '/hub';

    console.log('Verify Page Debug:', {
      clerkStatus,
      ticket,
      createdSessionId,
      flowType,
      isInvitationFromUrl,
      isInvitationFromStorage,
      isInvitation,
      hasClient: !!client,
      activeSessions: client?.activeSessions?.length || 0
    });

    // CRITICAL FIX: Handle client_mismatch better - try to recover
    if (clerkStatus === 'client_mismatch') {
      console.log('Client mismatch detected - this should not happen with setting disabled');
      // Instead of showing error, try to handle cross-browser scenario
      // The user's email is verified, just need them to login again
      setStatus('success');
      setErrorMsg('Email verified! Please log in on this browser.');
      setTimeout(() => {
        const loginUrl = new URL('/login', window.location.origin);
        // Pre-fill the email if we can get it from URL
        const emailHint = searchParams.get('email');
        if (emailHint) {
          loginUrl.searchParams.set('email', emailHint);
          loginUrl.searchParams.set('verified', 'true');
        }
        window.location.href = loginUrl.toString();
      }, 2000);
      return;
    }
    
    if (clerkStatus === 'expired') {
      setStatus('failed');
      setErrorMsg('This magic link has expired. Please request a new one.');
      return;
    }

    // CRITICAL FIX: Handle the ticket verification properly
    if (ticket) {
      console.log('Processing ticket verification...');
      handleEmailLinkVerification({
        redirectUrl: targetUrl,
      }).then(async (result: any) => {
        console.log('Verification result:', result);
        // CRITICAL: Ensure session is activated
        if (result?.createdSessionId) {
          console.log('Activating session:', result.createdSessionId);
          await setActive({ session: result.createdSessionId });
          
          // For signup verifications, always check if user was invited and set guest role
          if (flowType === 'signup') {
            console.log('[Verify] Signup detected (ticket path), checking invitation status...');
            try {
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const roleRes = await fetch('/api/auth/set-visitor-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isInvitation: true, checkServerSide: true }),
              });
              
              const roleData = await roleRes.json();
              console.log('[Verify] Set role response (ticket path):', roleRes.status, roleData);
            } catch (roleError) {
              console.error('[Verify] ❌ Error setting role (ticket path):', roleError);
            }
          }
        }
        setStatus('success');
        setTimeout(() => window.location.href = targetUrl, 1500);
      }).catch((err: any) => {
        console.error('Verification error:', err);
        setStatus('failed');
        setErrorMsg(err.errors?.[0]?.longMessage || 'Verification failed. The link might be invalid or expired.');
      });
    } else if (clerkStatus === 'verified') {
      console.log('Status is verified, processing...');
      // CRITICAL FIX: Handle all verified states properly
      if (createdSessionId) {
        console.log('Activating verified session:', createdSessionId);
        // Magic link verified, activate the session
        setActive({ session: createdSessionId }).then(async () => {
          console.log('Session activated successfully!');
          
          // CRITICAL: Wait for Clerk client to fully sync the session
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // For ALL signup verifications, call set-visitor-role 
          // The server will check if this user was invited and set guest role accordingly
          if (flowType === 'signup') {
            console.log('[Verify] Signup verification - calling set-visitor-role (server will check invitation status)');
            
            // Retry logic: Clerk session token may not be available immediately after session activation
            // The server needs the session JWT cookie which takes a moment to propagate
            let roleSuccess = false;
            for (let attempt = 1; attempt <= 4; attempt++) {
              try {
                // Increasing delay: 2s, 3s, 4s, 5s
                const delay = 1000 + (attempt * 1000);
                console.log(`[Verify] Attempt ${attempt}/4 - waiting ${delay}ms for session token...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                const roleRes = await fetch('/api/auth/set-visitor-role', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isInvitation: true, checkServerSide: true }),
                });
                
                const roleData = await roleRes.json();
                console.log(`[Verify] Attempt ${attempt} response:`, roleRes.status, roleData);
                
                if (roleRes.ok) {
                  console.log('[Verify] ✅ Successfully set guest role');
                  roleSuccess = true;
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('is_invitation');
                    sessionStorage.removeItem('invitation_ticket');
                  }
                  break;
                } else if (roleRes.status === 401) {
                  // Session not ready yet - retry
                  console.log(`[Verify] Session not ready yet (401), will retry...`);
                  continue;
                } else if (roleRes.status === 400 && roleData.error === 'Not an invited user') {
                  console.log('[Verify] User was not invited - normal signup, participant role kept');
                  roleSuccess = true; // Not an error, just not invited
                  break;
                } else {
                  console.error('[Verify] ❌ Unexpected error:', roleData);
                  break;
                }
              } catch (roleError) {
                console.error(`[Verify] ❌ Attempt ${attempt} error:`, roleError);
                if (attempt === 4) break;
              }
            }
            
            if (!roleSuccess) {
              console.error('[Verify] ❌ All attempts to set role failed');
            }
          }
          
          // Force check if session is now active
          console.log('Checking session status...');
          console.log('Active sessions:', client?.activeSessions?.length || 0);
          
          // Show success immediately
          setStatus('success');
          
          // CRITICAL: Use window.location.replace to avoid middleware issues
          // Replace instead of href to prevent back button issues
          setTimeout(() => {
            console.log('Redirecting to:', targetUrl);
            window.location.replace(targetUrl);
          }, 1500);
        }).catch((err: any) => {
          console.error('Session activation error:', err);
          // CRITICAL: If session activation fails, it's likely cross-browser
          setStatus('failed');
          setErrorMsg('This magic link was opened in a different browser. For security, magic links only work in the browser where they were requested. Please either: 1) Open the link in your original browser, or 2) Log in with your email and password on this device.');
        });
      } else if (client?.activeSessions && client.activeSessions.length > 0) {
        console.log('Session already activated');
        // Session already activated
        setStatus('success');
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1500);
      } else {
        console.log('Verified but no createdSessionId in if block - likely cross-browser');
        // This happens in cross-browser scenarios
        // Show helpful message instead of error
        setStatus('success');
        setErrorMsg('Email verified! Since you opened this link in a different browser, please log in with your email and password on this browser.');
        // Don't auto-redirect - let user click the button when ready
      }
    } else {
      console.log('No ticket or verified status, checking active sessions...');
      // CRITICAL FIX: Check for existing session
      if (client?.activeSessions && client.activeSessions.length > 0) {
        setStatus('success');
        setTimeout(() => window.location.href = targetUrl, 1500);
      } else {
        setStatus('failed');
        setErrorMsg('Invalid verification link. Please request a new one.');
      }
    }
  }, [loaded, searchParams, handleEmailLinkVerification, setActive, client]);

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
            {errorMsg ? (
              <>
                <p className="text-sm text-steward-dark/80">{errorMsg}</p>
                <Link href="/login" className="w-full mt-4 bg-steward-blue hover:bg-steward-orange text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-steward-blue/20 transition-colors">
                  Go to Login
                </Link>
              </>
            ) : (
              <p className="text-sm text-steward-dark/60">You are securely logged in. Redirecting...</p>
            )}
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
