'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Beaker, Lock } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function AiLabPage() {
  const router = useRouter();
  const { user } = useUser();
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
          setHasCompleted(!!data.profile?.community_status);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleModuleClick = (moduleId: string) => {
    if (!hasCompleted) {
      // Redirect to onboarding if not completed
      router.push('/onboarding/language');
    } else {
      // Navigate to module
      router.push(`/hub/ai-lab/${moduleId}`);
    }
  };

  const modules = [
    {
      id: 'prompt-engineering',
      title: 'Prompt Engineering Basics',
      description: 'Learn to write effective prompts for AI tools',
      status: 'available'
    },
    {
      id: 'content-creation',
      title: 'AI Content Creation',
      description: 'Create text, images, and videos using AI',
      status: 'available'
    },
    {
      id: 'bilingual-ai',
      title: 'Bilingual AI Tools',
      description: 'Use AI for English-Spanish translation and content',
      status: 'coming-soon'
    },
  ];

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
                onClick={() => router.push('/onboarding/language')}
                className="bg-steward-blue hover:bg-steward-orange text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Start Onboarding
              </button>
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => module.status === 'available' && handleModuleClick(module.id)}
              disabled={module.status === 'coming-soon'}
              className={`relative bg-white p-8 rounded-2xl shadow-lg border-2 transition-all text-left ${
                module.status === 'coming-soon'
                  ? 'border-steward-dark/10 opacity-50 cursor-not-allowed'
                  : hasCompleted
                  ? 'border-steward-green/30 hover:border-steward-green hover:shadow-xl hover:scale-[1.02]'
                  : 'border-steward-dark/10 hover:border-steward-blue/50 hover:shadow-xl'
              }`}
            >
              {/* Lock Icon for Non-Onboarded Users */}
              {!hasCompleted && module.status === 'available' && (
                <div className="absolute top-4 right-4">
                  <Lock size={24} className="text-steward-dark/30" />
                </div>
              )}

              {/* Coming Soon Badge */}
              {module.status === 'coming-soon' && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-steward-dark/10 text-steward-dark/40 rounded-full text-xs font-black uppercase">
                    Coming Soon
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-black text-steward-dark mb-3">{module.title}</h3>
              <p className="text-steward-dark/60 font-medium leading-relaxed">{module.description}</p>

              {module.status === 'available' && (
                <div className="mt-6">
                  <span className={`text-sm font-black uppercase tracking-wider ${
                    hasCompleted ? 'text-steward-green' : 'text-steward-blue'
                  }`}>
                    {hasCompleted ? 'Click to Start →' : 'Complete Onboarding to Access →'}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
