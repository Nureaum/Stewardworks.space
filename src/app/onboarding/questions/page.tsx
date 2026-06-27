'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Plus, Check } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function OnboardingQuestions() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // State for all 10 questions
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({
    1: '', 2: [], 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: []
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorQId, setErrorQId] = useState<number | null>(null);
  const { user } = useUser();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      setAvatarFile(file);
    }
  };

  const handleSaveAndContinue = async (isContinue: boolean) => {
    setIsSaving(true);

    if (user) {
      try {
        let finalAvatarUrl = null;

        // Upload the photo if they selected one
        if (avatarFile) {
          const formData = new FormData();
          formData.append('file', avatarFile);

          const uploadRes = await fetch('/api/upload-avatar', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalAvatarUrl = uploadData.publicUrl;
          } else {
            console.error('Upload error:', await uploadRes.text());
          }
        }

        // Map all 10 questions to our database schema
        const q1_communityStatus = String(answers[1] || '');
        const q2_learningStyleArray = Array.isArray(answers[2]) ? answers[2] : (answers[2] ? [String(answers[2])] : []);
        const q3_dreamJob = String(answers[3] || '');
        const q4_ageRange = String(answers[4] || '');
        const q5_preferredLanguage = String(answers[5] || '');
        const q6_internetAccess = String(answers[6] || '');
        const q7_trainingInterest = String(answers[7] || '');
        const q8_employmentStatus = String(answers[8] || '');
        const q9_timeCommitment = String(answers[9] || '');
        const q10_barriersArray = Array.isArray(answers[10]) ? answers[10] : (answers[10] ? [String(answers[10])] : []);

        const payload: any = {
          community_status: q1_communityStatus,
          learning_style: q2_learningStyleArray,
          dream_job: q3_dreamJob,
          age_range: q4_ageRange,
          preferred_language: q5_preferredLanguage,
          internet_access: q6_internetAccess,
          training_interest: q7_trainingInterest,
          employment_status: q8_employmentStatus,
          time_commitment: q9_timeCommitment,
          barriers: q10_barriersArray,
        };

        if (finalAvatarUrl) {
          payload.avatar_url = finalAvatarUrl;
        }

        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error('Save error:', error);
      }
    }

    setIsSaving(false);
    if (isContinue) {
      router.push('/onboarding/legal');
    } else {
      alert('Progress saved to Database!');
    }
  };

  const questions = [
    { id: 1, required: true, type: 'single' },
    { id: 2, required: true, type: 'multiple' },
    { id: 3, required: true, type: 'single' },
    { id: 4, required: true, type: 'single' },
    { id: 5, required: true, type: 'single' },
    { id: 6, required: true, type: 'single' },
    { id: 7, required: true, type: 'single' },
    { id: 8, required: false, type: 'single' },
    { id: 9, required: false, type: 'single' },
    { id: 10, required: false, type: 'multiple' },
  ];

  const handleSingleSelect = (qId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleMultiSelect = (qId: number, option: string) => {
    setAnswers(prev => {
      const current = prev[qId] as string[];
      if (current.includes(option)) {
        return { ...prev, [qId]: current.filter(o => o !== option) };
      } else {
        return { ...prev, [qId]: [...current, option] };
      }
    });
  };

  const handleAttemptContinue = () => {
    // Find first missing required question
    const missingQ = questions.find(q => {
      if (!q.required) return false;
      const ans = answers[q.id];
      return Array.isArray(ans) ? ans.length === 0 : ans === '';
    });

    if (missingQ) {
      setErrorQId(missingQ.id);
      const element = document.getElementById(`question-${missingQ.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrorQId(null);
    handleSaveAndContinue(true);
  };

  return (
    <div className="min-h-screen bg-steward-offwhite flex flex-col relative z-10 font-exo">
      <header className="bg-steward-dark px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div 
          className="w-10 h-10 bg-steward-blue rounded-full flex items-center justify-center font-black text-white text-sm cursor-pointer hover:scale-105 transition-transform" 
          onClick={() => router.push('/hub')}
        >
          SW
        </div>
        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
          {t('onboarding.title')}
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/onboarding/legal')}
            className="text-white/60 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all"
          >
            {t('onboarding.skip')}
          </button>
        <button 
            onClick={() => handleSaveAndContinue(false)}
            disabled={isSaving}
            className="bg-steward-green hover:bg-steward-orange text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
            {isSaving ? 'Saving...' : t('onboarding.save')}
        </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col space-y-12 py-10 px-6">
        <section className="flex flex-col items-center space-y-2">
          <div className="w-28 h-28 bg-white border-2 border-steward-blue rounded-full flex flex-col items-center justify-center text-steward-blue cursor-pointer hover:bg-steward-cream transition-colors relative group overflow-hidden shadow-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile preview" className="w-full h-full object-cover" />
            ) : (
              <Plus size={32} />
            )}
            <input 
              type="file" 
              accept="image/*"
              onChange={handlePhotoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
          <span className="text-[10px] font-bold text-steward-gold uppercase">Upload Photo</span>
        </section>

        <div className="space-y-16">
          {questions.map((q) => {
            const options = t(`onboarding.q${q.id}.options`).split(',');
            const currentAnswer = answers[q.id];

            return (
              <div key={q.id} id={`question-${q.id}`} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      errorQId === q.id ? 'bg-red-500 text-white' : 'bg-steward-blue text-white'
                    }`}>
                      {q.id}
                    </span>
                    <h2 className="text-xl font-bold text-steward-dark leading-tight">
                      {t(`onboarding.q${q.id}.title`)}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${q.required ? 'text-steward-orange' : 'text-steward-gold/50'}`}>
                      {q.required ? t('onboarding.required') : t('onboarding.optional')}
                    </span>
                    {errorQId === q.id && (
                      <span className="text-xs font-bold text-red-500 animate-pulse">
                        Please answer this question to continue.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {options.map((option, idx) => {
                    const isSelected = Array.isArray(currentAnswer) 
                      ? currentAnswer.includes(option) 
                      : currentAnswer === option;

                    return (
                <button 
                        key={idx}
                        onClick={() => q.type === 'single' ? handleSingleSelect(q.id, option) : handleMultiSelect(q.id, option)}
                        className={`group flex items-center p-4 border-2 rounded-xl transition-all text-left ${
                          isSelected 
                          ? 'border-steward-blue bg-steward-cream text-steward-blue shadow-md' 
                          : 'border-steward-gold/10 bg-white text-steward-dark/70 hover:border-steward-gold'
                  }`}
                >
                        <div className={`w-5 h-5 rounded-md border-2 mr-4 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-steward-blue border-steward-blue' : 'border-steward-gold/20'
                  }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                  </div>
                        <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>
                          {option}
                        </span>
                </button>
                    );
                  })}
            </div>
          </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-12 pb-20">
          <button 
            disabled={isSaving}
            onClick={handleAttemptContinue}
            className={`w-full max-w-sm py-5 rounded-2xl shadow-xl transition-all duration-300 font-black uppercase tracking-widest text-base bg-steward-blue hover:bg-steward-orange text-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Saving...' : t('onboarding.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
