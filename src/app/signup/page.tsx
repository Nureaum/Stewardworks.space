'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Mail, CheckCircle, ChevronLeft, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'magic_success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage("Passwords do not match");
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // 1. Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setStatus('error');
      setErrorMessage(authError.message);
      return;
    }

    // Check if email already exists (Supabase email enumeration protection check)
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      setStatus('error');
      setErrorMessage("An account with this email already exists. Please log in instead.");
      return;
    }

    // 2. Insert into profiles table
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone: phone,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    setStatus('success');
    // We redirect to the callback to run our smart routing / hub redirect logic.
    router.push('/auth/callback');
  };

  const handleMagicLink = async () => {
    if (!email) {
      setStatus('error');
      setErrorMessage("Please enter an email address for the magic link.");
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('magic_success');
    }
  };

  return (
    <div className="min-h-screen bg-steward-offwhite flex flex-col items-center justify-center font-exo p-4 py-12 relative z-10">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-steward-blue rounded-full flex items-center justify-center mb-4 text-white font-black text-xl shadow-inner">
            SW
          </div>
          <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tight">Create Account</h1>
          <p className="text-sm text-steward-dark/60 mt-2 text-center font-medium">
            Join the StewardWorks Hub
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-steward-green/10 border border-steward-green/30 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <CheckCircle className="text-steward-green" size={48} />
            </div>
            <h3 className="text-lg font-bold text-steward-dark">Account Created!</h3>
            <p className="text-sm text-steward-dark/80">
              Welcome to StewardWorks. Redirecting you to the Hub...
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
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-steward-gold/60" size={16} />
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium text-sm"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium text-sm"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="text-steward-gold/60" size={16} />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium text-sm"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-steward-gold/60" size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium text-sm"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-steward-gold/60" size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-steward-gold/60 hover:text-steward-blue transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-steward-gold/60" size={16} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-steward-gold/60 hover:text-steward-blue transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center">{errorMessage}</p>
            )}
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-steward-blue text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-steward-orange transition-colors shadow-lg shadow-steward-blue/20 disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? 'Processing...' : 'Create Account'}
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
