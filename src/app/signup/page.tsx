'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { Mail, CheckCircle, Lock, User, Phone, Eye, EyeOff, FileText } from 'lucide-react';
import Link from 'next/link';
import GamingAuthLayout from '@/app/components/auth/GamingAuthLayout';
import AuthCard from '@/app/components/auth/AuthCard';

export default function SignupPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'magic_success' | 'signup_success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isInvitation, setIsInvitation] = useState(false);
  const router = useRouter();

  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn, signOut } = useAuth();

  // Check URL for terms acceptance and restore form data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('termsAccepted') === 'true') {
        const sig = sessionStorage.getItem('terms_signature');
        if (sig) {
          setTermsAccepted(true);
        }
      }
      // Restore form data from sessionStorage
      const saved = sessionStorage.getItem('signup_form');
      if (saved) {
        const data = JSON.parse(saved);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setPassword(data.password || '');
        setConfirmPassword(data.confirmPassword || '');
      }
    }
  }, []);

  // Check if this is an invitation signup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const clerkTicket = params.get('__clerk_ticket');
      const clerkStatus = params.get('__clerk_status');

      if (clerkTicket && clerkStatus === 'sign_up') {
        setIsInvitation(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      router.push('/hub');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const cleanupStaleSessions = async () => {
      if (isLoaded && !isSignedIn && signUp?.status === undefined) {
        try {
          await signOut?.();
        } catch (e) {}
      }
    };
    cleanupStaleSessions();
  }, [isLoaded]);

  const handleTermsNavigation = () => {
    sessionStorage.setItem('signup_form', JSON.stringify({
      firstName, lastName, phone, email, password, confirmPassword
    }));
    router.push('/agreements');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (isSignedIn) {
      router.push('/hub');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage("Passwords do not match");
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      if (isSignedIn) {
        await signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const signUpParams: any = {
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          phone,
          terms_accepted: true,
          terms_accepted_at: sessionStorage.getItem('terms_accepted_at'),
          terms_signature: sessionStorage.getItem('terms_signature'),
        }
      };

      await signUp.create(signUpParams);

      await signUp.prepareEmailAddressVerification({
        strategy: "email_link",
        redirectUrl: `${window.location.origin}/verify?type=signup${isInvitation ? '&invitation=true' : ''}`
      });

      // Clear sessionStorage data after successful account creation
      sessionStorage.removeItem('signup_form');
      sessionStorage.removeItem('terms_signature');
      sessionStorage.removeItem('terms_accepted_at');

      setStatus('signup_success');
    } catch (err: any) {
      console.error("Clerk Signup Error:", err);
      setStatus('error');
      const clerkError = err.errors?.[0];
      if (clerkError?.code === 'form_identifier_exists') {
        setErrorMessage("An account with this email already exists. Please log in instead.");
      } else if (clerkError?.code === 'session_exists') {
        try {
          await signOut();
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryParams: any = {
            emailAddress: email,
            password,
            firstName,
            lastName,
            unsafeMetadata: {
              phone,
              terms_accepted: true,
              terms_accepted_at: sessionStorage.getItem('terms_accepted_at'),
              terms_signature: sessionStorage.getItem('terms_signature'),
            }
          };
          await signUp.create(retryParams);
          await signUp.prepareEmailAddressVerification({
            strategy: "email_link",
            redirectUrl: `${window.location.origin}/verify?type=signup${isInvitation ? '&invitation=true' : ''}`
          });

          // Clear sessionStorage data after successful account creation
          sessionStorage.removeItem('signup_form');
          sessionStorage.removeItem('terms_signature');
          sessionStorage.removeItem('terms_accepted_at');

          setStatus('signup_success');
        } catch (retryErr: any) {
          setErrorMessage(retryErr.errors?.[0]?.longMessage || 'Unable to create account. Please try again.');
        }
      } else {
        setErrorMessage(clerkError?.longMessage || 'An unexpected error occurred.');
      }
    }
  };

  return (
    <GamingAuthLayout>
      <AuthCard>
        {/* Branding */}
        <div className="flex flex-col items-center mb-3">
          <h1 className="text-xl font-black text-white uppercase tracking-tight">StewardWorks</h1>
          <p className="text-[#7FC4E8] text-xs font-bold uppercase tracking-[0.2em]">Create Account</p>
          {isInvitation && (
            <div className="mt-3 bg-steward-green/10 border border-steward-green/30 rounded-lg px-4 py-2 text-xs text-steward-green font-bold">
              ✓ Invited as Guest
            </div>
          )}
          {termsAccepted && (
            <div className="mt-3 bg-[#F0C64C]/10 border border-[#F0C64C]/30 rounded-lg px-4 py-2 text-xs text-[#7FC4E8] font-bold flex items-center gap-1.5">
              <CheckCircle size={14} /> Terms Accepted
            </div>
          )}
        </div>

        {status === 'success' ? (
          <div className="bg-steward-green/10 border border-steward-green/30 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <CheckCircle className="text-steward-green" size={48} />
            </div>
            <h3 className="text-lg font-bold text-white">Account Created!</h3>
            <p className="text-sm text-white/80">
              Welcome to StewardWorks. Redirecting you to the Hub...
            </p>
          </div>
        ) : status === 'signup_success' ? (
          <div className="bg-steward-green/10 border border-steward-green/30 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <CheckCircle className="text-steward-green" size={48} />
            </div>
            <h3 className="text-lg font-bold text-white">Verify your email!</h3>
            <p className="text-sm text-white/80">
              We&apos;ve sent a confirmation link to <span className="font-bold">{email}</span>. Click the link in that email to activate your account and log in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <div id="clerk-captcha"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-[#7FC4E8]/60" size={20} />
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  aria-label="First Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#182A57] border-2 border-[#2B3A6B] focus:border-[#E8823C] focus:ring-2 focus:ring-[#E8823C]/30 outline-none transition-all font-bold text-white placeholder:text-[#9AA6C0]"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-[#7FC4E8]/60" size={20} />
                </div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                  aria-label="Last Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#182A57] border-2 border-[#2B3A6B] focus:border-[#E8823C] focus:ring-2 focus:ring-[#E8823C]/30 outline-none transition-all font-bold text-white placeholder:text-[#9AA6C0]"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="text-[#7FC4E8]/60" size={20} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                required
                aria-label="Phone Number"
                className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#182A57] border-2 border-[#2B3A6B] focus:border-[#E8823C] focus:ring-2 focus:ring-[#E8823C]/30 outline-none transition-all font-bold text-white placeholder:text-[#9AA6C0]"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-[#7FC4E8]/60" size={20} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                aria-label="Email Address"
                className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#182A57] border-2 border-[#2B3A6B] focus:border-[#E8823C] focus:ring-2 focus:ring-[#E8823C]/30 outline-none transition-all font-bold text-white placeholder:text-[#9AA6C0]"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-[#7FC4E8]/60" size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                aria-label="Password"
                className="w-full pl-10 pr-10 py-2.5 rounded-sm bg-[#182A57] border-2 border-[#2B3A6B] focus:border-[#E8823C] focus:ring-2 focus:ring-[#E8823C]/30 outline-none transition-all font-bold text-white placeholder:text-[#9AA6C0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#7FC4E8]/60 hover:text-[#E85B94] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-[#7FC4E8]/60" size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
                aria-label="Confirm Password"
                className="w-full pl-10 pr-10 py-2.5 rounded-sm bg-[#182A57] border-2 border-[#2B3A6B] focus:border-[#E8823C] focus:ring-2 focus:ring-[#E8823C]/30 outline-none transition-all font-bold text-white placeholder:text-[#9AA6C0]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#7FC4E8]/60 hover:text-[#E85B94] transition-colors"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3">
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest text-center">{errorMessage}</p>
              </div>
            )}

            {/* Accept Terms & Conditions button */}
            {!termsAccepted && (
              <button
                type="button"
                onClick={handleTermsNavigation}
                className="w-full bg-transparent border-2 border-[#E85B94]/60 text-[#E85B94] py-2.5 rounded-sm font-bold uppercase tracking-widest hover:bg-[#E85B94]/10 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Accept Terms &amp; Conditions
              </button>
            )}

            {/* Create Account button */}
            <button
              type="submit"
              disabled={!termsAccepted || status === 'loading'}
              className="w-full bg-[#E85B94] text-[#0B1330] py-3 rounded-sm font-black uppercase tracking-[0.2em] hover:bg-[#F0C64C] transition-colors shadow-lg shadow-[#E85B94]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E85B94]"
            >
              {status === 'loading' ? 'Processing...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="mt-5 text-center">
          <p className="text-sm font-medium text-white/60">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#7FC4E8] hover:text-[#E85B94] transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </AuthCard>
    </GamingAuthLayout>
  );
}
