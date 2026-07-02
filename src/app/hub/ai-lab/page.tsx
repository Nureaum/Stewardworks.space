'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Beaker, Lock } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { getAILabs } from '@/app/actions/ai-labs';
import { AILabWithCohort } from '@/types/workshops';
import toast from 'react-hot-toast';

export default function AiLabPage() {
  const router = useRouter();
  const { user } = useUser();
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [labs, setLabs] = useState<AILabWithCohort[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);

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

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await getAILabs();
        setLabs(data);
      } catch (error) {
        toast.error('Failed to load AI Labs');
      } finally {
        setLoadingLabs(false);
      }
    };
    fetchLabs();
  }, []);

  const handleModuleClick = (labId: string) => {
    if (!hasCompleted) {
      const returnUrl = encodeURIComponent('/hub/ai-lab');
      router.push(`/onboarding/language?returnUrl=${returnUrl}`);
    } else {
      router.push(`/hub/ai-lab/${labId}`);
    }
  };

  return (
    <div className="min-h-screen bg-steward-offwhite p-8 font-exo">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-steward-dark hover:text-steward-blue transition-colors mb-12"
      >
        <ArrowLeft size={20} />
        <span className="font-bold uppercase tracking-widest text-sm">Back to Hub</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-6">
          <div className="bg-[#FFD700] w-24 h-24 rounded-2xl flex items-center justify-center text-steward-dark shadow-xl mx-auto">
            <Beaker size={48} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-steward-dark uppercase tracking-tighter">AI Lab</h1>
          <p className="text-xl text-steward-dark/60 leading-relaxed max-w-2xl mx-auto">
            Experimental space for testing AI tools and bilingual content creation workflows. This lab is where we explore the boundaries of AI in environmental stewardship.
          </p>

          {!hasCompleted && !isChecking && (
            <div className="bg-steward-blue/10 border-2 border-steward-blue/30 rounded-2xl p-6 max-w-2xl mx-auto">
              <p className="text-steward-dark font-bold mb-3">Complete onboarding to access AI Lab modules</p>
              <button
                onClick={() => {
                  const returnUrl = encodeURIComponent('/hub/ai-lab');
                  router.push(`/onboarding/language?returnUrl=${returnUrl}`);
                }}
                className="bg-steward-blue hover:bg-steward-orange text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Start Onboarding
              </button>
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {loadingLabs ? (
            <div className="col-span-1 md:col-span-2 text-center text-steward-dark/50 p-8 font-bold">
              Loading AI Labs...
            </div>
          ) : labs.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center text-steward-dark/50 p-8 font-bold bg-white rounded-2xl border-2 border-steward-dark/10">
              No AI Labs available right now. Please check back later.
            </div>
          ) : (
            labs.map((lab) => (
              <button
                key={lab.id}
                onClick={() => handleModuleClick(lab.id)}
                className={`relative bg-white p-8 rounded-2xl shadow-lg border-2 transition-all text-left ${
                  hasCompleted
                    ? 'border-steward-green/30 hover:border-steward-green hover:shadow-xl hover:scale-[1.02]'
                    : 'border-steward-dark/10 hover:border-steward-blue/50 hover:shadow-xl'
                }`}
              >
                {!hasCompleted && (
                  <div className="absolute top-4 right-4">
                    <Lock size={24} className="text-steward-dark/30" />
                  </div>
                )}
                
                <div className="text-xs font-bold uppercase tracking-widest text-steward-blue mb-2">
                  {lab.cohort_name}
                </div>
                <h3 className="text-2xl font-black text-steward-dark mb-3">{lab.title}</h3>

                <div className="mt-6">
                  <span className={`text-sm font-black uppercase tracking-wider ${
                    hasCompleted ? 'text-steward-green' : 'text-steward-blue'
                  }`}>
                    {hasCompleted ? 'Click to Start →' : 'Complete Onboarding to Access →'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
