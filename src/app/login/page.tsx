'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useAuth } from '@clerk/nextjs';
import { Mail, CheckCircle, ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'magic_success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'none' | 'enter_email' | 'email_sent' | 'success'>('none');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [crossBrowserHint, setCrossBrowserHint] = useState(false);
  const router = useRouter();
  
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, signOut } = useAuth();

  useEffect(() => {
    // If user is already signed in, redirect to hub
    if (isSignedIn) {
      router.push('/hub');
    }
  }, [isSignedIn, router]);

  // Check for cross-browser verification hint
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      const fromVerify = urlParams.get('verified');
      
      if (emailParam) {
        setEmail(emailParam);
      }
      
      if (fromVerify === 'true') {
        setCrossBrowserHint(true);
      }
    }
  }, []);

  useEffect(() => {
    // If user is already signed in, redirect to hub
    if (isSignedIn) {
      router.push('/hub');
    }
  }, [isSignedIn, router]);

  // Force cleanup any stale sessions on mount
  useEffect(() => {
    const cleanupStaleSessions = async () => {
      if (isLoaded && !isSignedIn && signIn?.status === undefined) {
        // Clear any stale Clerk state
        try {
          await signOut?.();
        } catch (e) {
          // Ignore errors - session might not exist
        }
      }
    };
    cleanupStaleSessions();
  }, [isLoaded]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setErrorMessage('');

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    if (!password) {
      setStatus('error');
      setErrorMessage('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setStatus('loading');

    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      if (completeSignIn.status === 'complete') {
        setStatus('success');
        await setActive({ session: completeSignIn.createdSessionId });
        router.push('/hub');
      } else if (completeSignIn.status === 'needs_first_factor') {
        // The password was correct, but the email is unverified!
        // Let's automatically send them a verification link to complete the login.
        const emailFactor = completeSignIn.supportedFirstFactors.find(
          (f: any) => f.strategy === 'email_link' && f.safeIdentifier === email
        ) as any;

        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_link',
            emailAddressId: emailFactor.emailAddressId,
            redirectUrl: `${window.location.origin}/verify?type=login`
          });
          setStatus('magic_success'); // Reusing the magic link success screen to say "Check Email"
        } else {
          setStatus('error');
          setErrorMessage('Your email is unverified. Please use the Magic Link option to verify it.');
        }
      } else if ((completeSignIn.status as string) === 'needs_client_trust') {
        // New device detected. Clerk requires a second factor (Client Trust).
        const emailFactor = completeSignIn.supportedSecondFactors?.find(
          (f: any) => f.strategy === 'email_link' && f.safeIdentifier === email
        ) as any;

        if (emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_link',
            emailAddressId: emailFactor.emailAddressId,
            redirectUrl: `${window.location.origin}/verify?type=login`
          });
          setStatus('magic_success'); // Check email UI
        } else {
          setStatus('error');
          setErrorMessage('New device detected. Please use the Magic Link to sign in.');
        }
      } else {
        // Needs MFA, etc.
        setStatus('error');
        setErrorMessage(`Further verification is required. Status: ${completeSignIn.status}. Please use the Magic Link.`);
      }
    } catch (err: any) {
      setStatus('error');
      // Map Clerk errors to user-friendly messages
      const clerkError = err.errors?.[0];
      if (clerkError?.code === 'form_password_incorrect') {
        setErrorMessage('INVALID_CREDENTIALS');
      } else if (clerkError?.code === 'form_identifier_not_found') {
        setErrorMessage('ACCOUNT_NOT_FOUND');
      } else if (clerkError?.code === 'session_exists') {
        // Already logged in
        router.push('/hub');
      } else {
        setErrorMessage(clerkError?.longMessage || 'An unexpected error occurred.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!isLoaded) return;
    
    // If they just clicked the link, take them to the email entry step
    if (forgotPasswordStep === 'none') {
      setForgotPasswordStep('enter_email');
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    // If they are on the enter_email step, submit it
    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('Please enter your email to reset your password.');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setForgotPasswordStep('email_sent');
      setStatus('idle');
    } catch (err: any) {
      setStatus('error');
      const clerkError = err.errors?.[0];
      if (clerkError?.code === 'form_identifier_not_found') {
        setErrorMessage('No account found with this email.');
      } else {
        setErrorMessage(clerkError?.longMessage || 'An error occurred sending the reset code.');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (newPassword.length < 6) {
      setStatus('error');
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match.');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        setStatus('success');
        setForgotPasswordStep('success');
        await setActive({ session: result.createdSessionId });
        router.push('/hub');
      } else {
        setStatus('error');
        setErrorMessage('Failed to reset password. Check your code and try again.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.errors?.[0]?.longMessage || 'Invalid code or password.');
    }
  };

  const handleMagicLink = async () => {
    if (!isLoaded) return;
    if (!email) {
      setStatus('error');
      setErrorMessage("Please enter an email address for the magic link.");
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');

    try {
      // CRITICAL FIX: ALWAYS force a complete reset before magic link
      // This handles all edge cases: password filled, password touched, existing sessions
      console.log('Forcing complete Clerk state reset...');
      
      try {
        // Force sign out regardless of current state
        await signOut();
        console.log('Sign out completed');
      } catch (signOutErr) {
        console.log('Sign out not needed or already signed out');
      }
      
      // Wait for Clerk to fully reset (increased delay)
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log('Creating fresh signIn for magic link:', email);
      const signInResult = await signIn.create({
        identifier: email,
      });

      console.log('SignIn created, looking for email link factor...');
      const emailLinkFactor = signInResult.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_link'
      ) as any;

      if (emailLinkFactor) {
        console.log('Sending magic link...');
        await signIn.prepareFirstFactor({
          strategy: 'email_link',
          emailAddressId: emailLinkFactor.emailAddressId,
          redirectUrl: `${window.location.origin}/verify?type=login`,
        });
        console.log('Magic link sent successfully!');
        setStatus('magic_success');
      } else {
        console.log('No email link factor found');
        setStatus('error');
        setErrorMessage('ACCOUNT_NOT_FOUND');
      }
    } catch (err: any) {
      console.error('Magic link error:', err);
      setStatus('error');
      const clerkError = err.errors?.[0];
      
      if (clerkError?.code === 'form_identifier_not_found') {
        setErrorMessage('ACCOUNT_NOT_FOUND');
      } else if (clerkError?.code === 'session_exists' || clerkError?.message?.includes('active session') || clerkError?.message?.includes('authenticate')) {
        // Any session-related error - force page reload to completely reset
        console.log('Session conflict detected, reloading page...');
        setStatus('error');
        setErrorMessage('Resetting session... Please wait.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setErrorMessage(clerkError?.longMessage || 'An unexpected error occurred. Please refresh the page and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-steward-offwhite flex flex-col items-center justify-center font-exo p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-steward-blue rounded-full flex items-center justify-center mb-4 text-white font-black text-xl shadow-inner">
            SW
          </div>
          <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tight">
            {forgotPasswordStep === 'email_sent' ? 'New Password' : forgotPasswordStep === 'enter_email' ? 'Reset Password' : 'Log In'}
          </h1>
          <p className="text-sm text-steward-dark/60 mt-2 text-center font-medium">
            {forgotPasswordStep === 'email_sent' 
              ? 'Enter the 6-digit code sent to your email and your new password.'
              : forgotPasswordStep === 'enter_email'
              ? 'Enter your email address and we will send you a reset code.'
              : 'Enter your email and password to access the StewardWorks Hub.'}
          </p>
        </div>

        {crossBrowserHint && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-blue-800 text-sm font-bold mb-1">✓ Email Verified!</p>
            <p className="text-blue-600 text-xs">
              Your email is verified. Please log in on this browser to continue.
            </p>
          </div>
        )}

        {status === 'success' ? (
          <div className="bg-steward-green/10 border border-steward-green/30 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <CheckCircle className="text-steward-green" size={48} />
            </div>
            <h3 className="text-lg font-bold text-steward-dark">Logged In!</h3>
            <p className="text-sm text-steward-dark/80">
              Redirecting you to the Hub...
            </p>
          </div>
        ) : status === 'magic_success' ? (
          <div className="bg-steward-green/10 border border-steward-green/30 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <CheckCircle className="text-steward-green" size={48} />
            </div>
            <h3 className="text-lg font-bold text-steward-dark">Check your email!</h3>
            <p className="text-sm text-steward-dark/80">
              We've sent a magic link to <span className="font-bold">{email}</span>. Click the link in that email to enter the site.
            </p>
            <button 
              onClick={() => setStatus('idle')}
              className="text-xs font-bold text-steward-blue uppercase tracking-widest mt-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : forgotPasswordStep === 'email_sent' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CheckCircle className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit Code"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium tracking-widest"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-steward-gold/60 hover:text-steward-blue transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-steward-gold/60 hover:text-steward-blue transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {status === 'error' && (
                <div className="mt-2 ml-1">
                  <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{errorMessage}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-steward-blue text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-steward-orange transition-colors shadow-lg shadow-steward-blue/20 disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : forgotPasswordStep === 'enter_email' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-4">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
              {status === 'error' && (
                <div className="mt-2 ml-1">
                  <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{errorMessage}</p>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className="w-full bg-steward-blue text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-steward-orange transition-colors shadow-lg shadow-steward-blue/20 disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div id="clerk-captcha"></div>
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-steward-gold/60 hover:text-steward-blue transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="mt-2 flex justify-end px-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-steward-blue hover:text-steward-orange transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              {status === 'error' && (
                <div className="mt-2 ml-1">
                  {errorMessage === 'INVALID_CREDENTIALS' ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                      <p className="text-red-600 text-xs font-bold">
                        Email or password is incorrect.
                      </p>
                      <p className="text-red-500/80 text-[11px]">
                        Double-check your password. If you originally signed up without a password, please use the <strong>Send Magic Link</strong> button below. Otherwise, you can{' '}
                        <Link href="/signup" className="font-black underline text-steward-blue hover:text-steward-orange transition-colors">
                          create a new account
                        </Link>.
                      </p>
                    </div>
                  ) : errorMessage === 'EMAIL_NOT_CONFIRMED' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
                      <p className="text-yellow-700 text-xs font-bold">
                        Your email hasn't been verified yet.
                      </p>
                      <p className="text-yellow-600/80 text-[11px]">
                        Check your inbox for the confirmation link we sent when you signed up. Click that link first, then come back and log in.
                      </p>
                    </div>
                  ) : errorMessage === 'ACCOUNT_NOT_FOUND' ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                      <p className="text-red-600 text-xs font-bold">
                        No account found with this email.
                      </p>
                      <p className="text-red-500/80 text-[11px]">
                        You must{' '}
                        <Link href="/signup" className="font-black underline text-steward-blue hover:text-steward-orange transition-colors">
                          create an account
                        </Link>{' '}
                        first before you can log in with a magic link!
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-steward-blue text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-steward-orange transition-colors shadow-lg shadow-steward-blue/20 disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? 'Processing...' : 'Log In'}
            </button>
            
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</div>
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={status === 'loading' || !email}
              className="w-full bg-white border-2 border-steward-blue text-steward-blue py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-steward-blue/5 transition-colors disabled:opacity-50"
            >
              Send Magic Link
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-steward-dark/60">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-steward-blue hover:text-steward-orange transition-colors">
              Create Account
            </Link>
          </p>
        </div>

        {forgotPasswordStep !== 'none' ? (
          <button 
            onClick={() => { setForgotPasswordStep('none'); setStatus('idle'); setErrorMessage(''); setConfirmPassword(''); setResetCode(''); setNewPassword(''); }}
            className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-steward-gold uppercase tracking-widest hover:text-steward-dark transition-colors w-full"
          >
            <ChevronLeft size={14} /> Back to Login
          </button>
        ) : (
          <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-steward-gold uppercase tracking-widest hover:text-steward-dark transition-colors">
            <ChevronLeft size={14} /> Back to Home
          </Link>
        )}
      </div>
      
      {/* Background visual accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[10%] right-[5%] text-[12vw] font-black opacity-[0.02] text-steward-green select-none uppercase tracking-tighter">
          Steward
        </div>
      </div>
    </div>
  );
}
