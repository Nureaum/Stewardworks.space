'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Users, MapPin, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function IntroAIContentPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          // Check if user has completed onboarding questionnaire
          // community_status is a required field from question 1
          if (data.profile?.community_status) {
            setHasCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [user, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-steward-offwhite flex items-center justify-center font-exo">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-steward-blue mx-auto" />
          <p className="text-steward-dark/60 font-bold">Checking registration status...</p>
        </div>
      </div>
    );
  }

  // Do not block rendering if not completed, we want them to see the page

  return (
    <div className="min-h-screen bg-steward-offwhite p-8 font-exo">
      <button 
        onClick={() => router.push('/hub/pilot-workshops')}
        className="flex items-center gap-2 text-steward-dark hover:text-steward-blue transition-colors mb-12"
      >
        <ArrowLeft size={20} />
        <span className="font-bold uppercase tracking-widest text-sm">Back to Workshops</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-steward-dark/5 overflow-hidden">
          {/* Header */}
          <div className="bg-steward-blue p-12 text-white">
            <span className="px-4 py-1 bg-steward-green text-white rounded-full text-xs font-black uppercase inline-block mb-4">Registered ✓</span>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">Intro to AI Content</h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Learn how to use AI tools to create engaging content for social media, blogs, and multimedia projects.
            </p>
          </div>

          {/* Workshop Details */}
          <div className="p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-steward-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={24} className="text-steward-blue" />
                </div>
                <div>
                  <h3 className="font-black text-steward-dark uppercase text-sm tracking-wider mb-1">Date</h3>
                  <p className="text-steward-dark/60 font-bold">March 15, 2026</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-steward-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="text-steward-blue" />
                </div>
                <div>
                  <h3 className="font-black text-steward-dark uppercase text-sm tracking-wider mb-1">Time</h3>
                  <p className="text-steward-dark/60 font-bold">10:00 AM - 2:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-steward-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users size={24} className="text-steward-blue" />
                </div>
                <div>
                  <h3 className="font-black text-steward-dark uppercase text-sm tracking-wider mb-1">Capacity</h3>
                  <p className="text-steward-dark/60 font-bold">25 participants</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-steward-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} className="text-steward-blue" />
                </div>
                <div>
                  <h3 className="font-black text-steward-dark uppercase text-sm tracking-wider mb-1">Location</h3>
                  <p className="text-steward-dark/60 font-bold">Imperial Valley Campus</p>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className="border-t border-steward-dark/10 pt-8">
              <h2 className="text-2xl font-black text-steward-dark uppercase mb-6">What You'll Learn</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-steward-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                  <p className="text-steward-dark/70 font-medium">AI-powered content creation tools and techniques</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-steward-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                  <p className="text-steward-dark/70 font-medium">Writing prompts for generating text, images, and videos</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-steward-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                  <p className="text-steward-dark/70 font-medium">Editing and refining AI-generated content</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-steward-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                  <p className="text-steward-dark/70 font-medium">Best practices for responsible AI use</p>
                </li>
              </ul>
            </div>

            {/* Confirmation Message */}
            <div className="border-t border-steward-dark/10 pt-8">
              <div className="bg-steward-green/10 border-2 border-steward-green/30 rounded-2xl p-6 text-center">
                <p className="text-steward-dark font-bold text-lg mb-2">You're all set! ✓</p>
                <p className="text-steward-dark/60 font-medium">
                  You're registered for this workshop. We'll send you a reminder before the event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
