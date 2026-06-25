'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Mail, CheckCircle, ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'magic_success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('success');
      router.push('/auth/callback'); // This will trigger the hub redirect
    }
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
    <div className="min-h-screen bg-steward-offwhite flex flex-col items-center justify-center font-exo p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-steward-blue rounded-full flex items-center justify-center mb-4 text-white font-black text-xl shadow-inner">
            SW
          </div>
          <h1 className="text-2xl font-black text-steward-dark uppercase tracking-tight">Log In</h1>
          <p className="text-sm text-steward-dark/60 mt-2 text-center font-medium">
            Enter your email and password to access the StewardWorks Hub.
          </p>
        </div>

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
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
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
                  <Mail className="text-steward-gold/60" size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-steward-blue focus:ring-2 focus:ring-steward-blue/20 outline-none transition-all font-bold text-steward-dark placeholder:text-gray-400 placeholder:font-medium"
                />
              </div>
              {status === 'error' && (
                <p className="text-red-500 text-xs mt-2 ml-2 font-bold uppercase tracking-widest">{errorMessage}</p>
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

        <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-steward-gold uppercase tracking-widest hover:text-steward-dark transition-colors">
          <ChevronLeft size={14} /> Back to Home
        </Link>
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
